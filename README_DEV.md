### Building and publishing via Github Actions
The extension is built as an artifact of Github Actions on every commit to `main`.
It's published on the VSCode marketplace at every tagged commit.
The version of the extension is hardcoded on `client/package.json` and `server/server.py`.
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
This will output an extension file (`.vsix`) which you can install by righ-clicking on it.