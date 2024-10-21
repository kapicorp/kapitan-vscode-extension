
import { join } from "path";
import { extensions } from "vscode";

// Extension info
export const EXTENSION_JSON = extensions.getExtension("quali-torque.torque-language-extension").packageJSON;
export const EXTENSION_NAME = EXTENSION_JSON.displayName;
export const EXTENSION_PATH = EXTENSION_JSON.extensionLocation.fsPath;

export const IS_WIN = process.platform === "win32";
export const LS_VENV_NAME = "torque-lsp";
export const LS_VENV_PATH = join(EXTENSION_PATH, LS_VENV_NAME);

export const TORQUE_LS_SERVER = "torque_lsp"