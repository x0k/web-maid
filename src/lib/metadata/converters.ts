import { Transform } from './core';

export const toTitle: Transform<string, string> = (value) => {
  const trimmed = value.replace(/(^[\s|\\-/•—]+)/)
}