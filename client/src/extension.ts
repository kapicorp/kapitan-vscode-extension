/* -------------------------------------------------------------------------
 * Original work Copyright (c) Microsoft Corporation. All rights reserved.
 * Original work licensed under the MIT License.
 * See ThirdPartyNotices.txt in the project root for license information.
 * All modifications Copyright (c) Open Law Library. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http: // www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ----------------------------------------------------------------------- */
"use strict";

import * as net from "net";
import * as path from "path";
import { ExtensionContext, ExtensionMode, workspace, window, commands, WebviewPanel, ViewColumn } from "vscode";
import { installLSWithProgress } from "./setup";
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
} from "vscode-languageclient/node";
import {
    activateYamlExtension,
    addSchemasToYamlConfig
} from './yamlHelper';
import { BlueprintsProvider } from './blueprintsExplorer';
import { SandboxStartPanel } from './startSandboxWebview';
import { ProfilesProvider } from "./profilesExplorer";
import { torqueLogin } from  "./torqueLogin"
import { SandboxesProvider } from "./sandboxesExplorer";
import { SandboxDetailsPanel } from "./sandboxDetails";
import { Profile, Sandbox } from "./models";

let client: LanguageClient;

function getClientOptions(): LanguageClientOptions {
    return {
        // Register the server for plain text documents
        documentSelector: [
            { scheme: "file", language: "yaml" },            
        ],
        outputChannelName: "Torque",
        synchronize: {
            // Notify the server about file changes to '.yaml files contain in the workspace
            fileEvents: workspace.createFileSystemWatcher("**/*.yaml"),
        },
    };
}

function startLangServerTCP(addr: number): LanguageClient {
    const serverOptions: ServerOptions = () => {
        return new Promise((resolve /*, reject */) => {
            const clientSocket = new net.Socket();
            clientSocket.connect(addr, "127.0.0.1", () => {
                resolve({
                    reader: clientSocket,
                    writer: clientSocket,
                });
            });
        });
    };

    return new LanguageClient(
        `tcp lang server (port ${addr})`,
        serverOptions,
        getClientOptions()
    );
}

function startLangServer(
    command: string,
    args: string[],
    cwd: string
): LanguageClient {
    const serverOptions: ServerOptions = {
        args,
        command,
        options: { cwd },
    };
    return new LanguageClient(command, serverOptions, getClientOptions());
}

async function activateYamlFeatures(context: ExtensionContext) {
    await addSchemasToYamlConfig(context.extensionPath);
    await activateYamlExtension();
}

export async function activate(context: ExtensionContext) {
    if (context.extensionMode === ExtensionMode.Development) {
        // Development - Run the server manually
        client = startLangServerTCP(2087);
    } else {
        // Production - Client is going to run the server (for use within `.vsix` package)
        const cwd = path.join(__dirname, "..", "out");
        
        const python = await installLSWithProgress(context);
        client = startLangServer(python, ["-m", "server"], cwd);
    }

    context.subscriptions.push(client.start());

	// PROFILES
    const profilesProvider = new ProfilesProvider();
    window.registerTreeDataProvider('profilesView', profilesProvider);
    commands.registerCommand('profilesView.refreshEntry', () => profilesProvider.refresh());
    commands.registerCommand('profilesView.setAsDefaultEntry', (node: Profile) => profilesProvider.setAsDefault(node));
    commands.registerCommand('profilesView.removeEntry', (node: Profile) => profilesProvider.removeEntry(node));

    let loginPanel: WebviewPanel | undefined
    context.subscriptions.push(
        commands.registerCommand('profilesView.addProfile', () => {
            if (loginPanel) {
                loginPanel.reveal(loginPanel.viewColumn || ViewColumn.Active)
            } else {
                loginPanel = torqueLogin(context.extensionUri, profilesProvider)
                loginPanel.onDidDispose(
                    () => {
                        loginPanel = undefined
                    },
                    undefined,
                    context.subscriptions
                )
            }
        })
    )

    // BLUEPRINTS
	const blueprintsProvider = new BlueprintsProvider();
	window.registerTreeDataProvider('blueprintsExplorerView', blueprintsProvider);
	commands.registerCommand('blueprintsExplorerView.refreshEntry', () => blueprintsProvider.refresh());
    
    // SANDBOXES
    const sandboxesProvider = new SandboxesProvider();
    window.registerTreeDataProvider('environmentsExplorerView', sandboxesProvider);
	commands.registerCommand('environmentsExplorerView.refreshEntry', () => sandboxesProvider.refresh());
    commands.registerCommand('environmentsExplorerView.getEnvDetails', (sandbox: any) => sandboxesProvider.getEnvDetails(sandbox));
    commands.registerCommand('environmentsExplorerView.endEnvironment', (sandbox: Sandbox) => sandboxesProvider.endEnvironment(sandbox));


    context.subscriptions.push(
		commands.registerCommand('extension.openReserveForm', (bpname:string, inputs:Array<string>, branch: string, repoName: string, is_sample: boolean) => {
            SandboxStartPanel.createOrShow(context.extensionUri, bpname, inputs, branch, repoName, is_sample);
        })
	);

    context.subscriptions.push(
        commands.registerCommand('extension.showSandboxDetails', (sandbox: any) => {
            SandboxDetailsPanel.createOrShow(context.extensionUri, sandbox['id'], sandbox['name'], sandbox['blueprint_name'])
        })
    )

}

export function deactivate(): Thenable<void> {
    return client ? client.stop() : Promise.resolve();
}
