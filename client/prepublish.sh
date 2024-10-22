#!/bin/sh
set -eu
cp -Rf ../server/. ./out/server
cp ../*.md ./
cp ../LICENSE ./LICENSE
uv export --no-emit-project --no-dev --format requirements-txt --frozen > ./out/server/requirements.txt
npm run compile