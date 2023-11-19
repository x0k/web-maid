#!/bin/bash

d:
  bun --bun run dev

b:
  NODE_ENV=production bun --bun run build && \
    DEV=true bun scripts/docs.ts

c:
  bun --bun run check

t:
  bun --bun run test
