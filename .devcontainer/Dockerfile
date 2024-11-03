FROM ghcr.io/astral-sh/uv:debian
RUN apt-get -q update && \
    apt-get install -y --no-install-recommends \
    sudo \
    vim \
    npm \
    python3-venv && \
    apt-get clean && rm -rf /var/lib/apt/lists/*
RUN npm install -g @vscode/vsce

# Setup non-root user
ARG USERNAME=user
ARG USER_UID=1000
ARG USER_GID=$USER_UID
RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME \
    #
    # [Optional] Add sudo support. Omit if you don't need to install software after connecting.
    && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME
