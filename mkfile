#!/bin/bash

zip:
  zip -r scraper-$(jq -r .version package.json).zip ./dist

docs:
  DEV=true bun scripts/docs.ts

d:
  bun --bun run dev

b:
  NODE_ENV=production bun --bun run build && \
    mk docs && \
    mk zip
c:
  bun --bun run check

t:
  bun run test
