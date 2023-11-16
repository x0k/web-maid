#!/bin/bash

d:
  bun --bun run dev

b:
  NODE_ENV=production bun --bun run build

c:
  bun --bun run check

t:
  bun --bun run test
