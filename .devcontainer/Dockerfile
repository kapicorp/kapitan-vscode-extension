FROM mcr.microsoft.com/vscode/devcontainers/typescript-node
RUN apt-get update && apt-get install -y python3 python3-pip python3.11-venv
RUN ln -s /usr/bin/python3 /usr/bin/python
RUN npm install -g @vscode/vsce