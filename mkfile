#!/bin/bash

# check
c:
  bun --bun run check

# test
t:
  bun run test

d:
  bun --bun run dev || mk docs

docs:
  DEV=true bun scripts/docs.ts

# dev build for features testing that don't work with dev server (sandboxes)
b:
  bun --bun run build --mode test && \
    mk docs

# production build
build:
  bun --bun run build && \
    mk docs

tag:
  mv dist.crx scraper-$(jq -r .version package.json).crx

pack:
  docker run -it --rm --entrypoint "" \
    -v $(pwd):/usr/src/app \
    -v $HOME/Sync/scraper/key.pem:/usr/src/key.pem \
    zenika/alpine-chrome chromium-browser --no-sandbox \
    --pack-extension=/usr/src/app/dist --pack-extension-key=/usr/src/key.pem

release:
  mk build && mk pack && mk tag
