import { join } from "path";
import { extensions, window } from "vscode";

// Extension info
const extension = extensions.getExtension("kapicorp.kapitan");
if (!extension) {
    window.showErrorMessage("Failed to load extension information.");
    throw new Error("Extension not found!");
}
export const EXTENSION_JSON = extension.packageJSON;
export const EXTENSION_NAME = EXTENSION_JSON.displayName;
export const EXTENSION_PATH = EXTENSION_JSON.extensionLocation.fsPath;

export const IS_WIN = process.platform === "win32";
export const LS_VENV_NAME = "kapitan-language-server-venv";
export const LS_VENV_PATH = join(EXTENSION_PATH, LS_VENV_NAME);
