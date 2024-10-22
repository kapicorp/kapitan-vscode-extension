#!/bin/bash
set -eu

# Link bash history from persistence
sudo chown -R 1000:1000 /devcontainer-persistence
touch /devcontainer-persistence/.bash_history
if [ ! -e ~/.bash_history ]; then
  ln -s /devcontainer-persistence/.bash_history ~/.bash_history
fi

for file in ~/.bashrc ~/.bash_profile; do
  [ ! -f "$file" ] && touch "$file"
  grep -q "export PYTHONPATH=$(pwd)" "$file" || echo "export PYTHONPATH=$(pwd)${PYTHONPATH:+:${PYTHONPATH}}" >> "$file"
done
grep -q "source $(pwd)/.venv/bin/activate" ~/.bashrc || echo "source $(pwd)/.venv/bin/activate" >> ~/.bashrc

uv lock
uv sync --locked
uv run pre-commit install
npm --prefix client install