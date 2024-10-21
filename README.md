# kapitan-vscode-extension
VSCode Extension for Kapitan

### Local development:
Use the devcontainer included or a GitHub Codespace and 
* Compile the `client` by running `npm --prefix client run compile`.
* Launch the python server by running from the workspace's root
```bash
python -m server --tcp
```
Then press F5, which will open another VSCode window with the extension activated.

The python server runs from the original window, at the terminal you used before, and all logs appear there. If you make changes to the python code, restart the python command and reload the VSCode debugging window.

### To publish packaged extension locally:
Use the devcontainer included or a GitHub Codespace and run the following from the `./client` folder:
```bash
npm run compile
npm run webpack
npm run vscepack
```

To install run the following, after making sure you have uninstalled any existing installations of the extension:
```bash
code --force --install-extension PATH_TO_PACKAGES_EXTENSION.vsix
```
Make sure to reload the VSCode window after installation.


### Copyright Note
The `client` folder is essentially a modified copy of the `client` folder from https://github.com/QualiTorque/torque-vs-code-extensions

The initial folder structure vscode setup and CI were also heavily influenced from the same repo.