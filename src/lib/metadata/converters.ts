import mime from "mime";

import { Transform } from "./core";

export const toTrimmed: Transform<string, string> = (value) =>
  value.trim() || null;

export const toTitle: Transform<string, string> = (value) => {
  const trimmed = value.replace(/(^[\s|\\-/•—]+)|([\s|\\-/•—]+$)/g, "");
  return (
    trimmed.toLocaleLowerCase().replace(/\b\w/g, (l) => l.toUpperCase()) || null
  );
};

export const toMimeType: Transform<string, string> = (value) =>
  mime.getType(value);
