import logging
import re
from pathlib import Path
from urllib.parse import unquote, urlparse

from lsprotocol.types import (
    ConfigurationItem,
    ConfigurationParams,
    InitializedParams,
    Location,
    Position,
    Range,
    TextDocumentPositionParams,
    TextDocumentSyncKind,
)
from pygls.server import LanguageServer
from pygls.workspace.text_document import TextDocument

server = LanguageServer(name="kapitan-language-server", version="0.0.3")
INVENTORY_PATH = Path()
YAML_EXTENSION = ""


def process_settings(workspace_path: Path, settings: dict):
    global INVENTORY_PATH
    global YAML_EXTENSION
    INVENTORY_PATH = workspace_path / settings["inventoryPath"]
    if settings["showDebugLogs"]:
        logging.getLogger().setLevel(logging.DEBUG)
    YAML_EXTENSION = settings["YAMLExtension"]


@server.feature("initialized")
def on_initialized(ls: LanguageServer, params: InitializedParams):
    workspace_path = Path(unquote(urlparse(ls.workspace.root_uri).path))
    requests = ConfigurationParams(items=[ConfigurationItem(section="kapitan")])
    server.get_configuration(
        requests,
        lambda list_of_settings: process_settings(workspace_path, list_of_settings[0]),
    )


@server.feature("initialize")
def initialize(ls: LanguageServer, params):
    return {
        "capabilities": {
            "textDocumentSync": TextDocumentSyncKind.Full,
            "hoverProvider": True,
        }
    }


@server.feature("textDocument/definition")
def goto_definition(ls: LanguageServer, params: TextDocumentPositionParams):
    document = ls.workspace.get_text_document(params.text_document.uri)
    class_name = get_class_name_as_location(document, params.position)
    document_dir = Path(unquote(urlparse(params.text_document.uri).path)).parent
    if path := resolve_class_file(class_name, document_dir):
        # TODO check if we are in the classes section
        return Location(uri=path.as_uri(), range=Range(Position(0, 0), Position(0, 0)))


def get_class_name_as_location(document: TextDocument, position: Position) -> str:
    line = document.lines[position.line]
    char_pos = position.character
    start_match = re.search(r"\s", line[:char_pos][::-1])
    end_match = re.search(r"\s", line[char_pos:])
    if start_match:
        start = char_pos - start_match.start() - 1
        end = char_pos + end_match.start() if end_match else len(line)
        return line[start:end].strip()
    else:
        return ""


def resolve_class_file(class_name: str, document_dir: Path) -> Path | None:
    if not class_name:
        return

    if class_name.startswith("."):
        base_path = document_dir
        class_name = class_name[1:]
    else:
        base_path = INVENTORY_PATH / "classes"
    relpath = class_name.replace(".", "/")

    if (base_path / relpath).is_dir():
        file = base_path / relpath / f"init.{YAML_EXTENSION}"
    else:
        file = base_path / f"{relpath}.{YAML_EXTENSION}"
    logging.debug(f"Potential class definition file: {file}")
    if file.is_file():
        return file
