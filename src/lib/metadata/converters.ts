import mime from "mime";
import chrono from "chrono-node";

import { JSONPrimitive } from "@/lib/json";
import { JsonLike } from "@/lib/json-like-traverser";

import { Transform } from "./core";

export const toString: Transform<JsonLike<JSONPrimitive | Date>, string> = (
  value
) => {
  return typeof value === "string" ? value : JSON.stringify(value);
};

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

export const toDate: Transform<string, Date> = (value) =>
  chrono.casual.parseDate(value) ?? chrono.ru.casual.parseDate(value);
