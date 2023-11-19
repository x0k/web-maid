#!/bin/bash

docs:
  DEV=true bun scripts/docs.ts

d:
  bun --bun run dev

b:
  NODE_ENV=production bun --bun run build && \
    mk docs
c:
  bun --bun run check

t:
  bun --bun run test
