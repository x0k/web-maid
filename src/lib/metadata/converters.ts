import mime from "mime";
import * as chrono from "chrono-node";

import { JSONPrimitive } from "@/lib/json";
import { JsonLike } from "@/lib/json-like-traverser";

import { Transform } from "./core";

export const toString: Transform<JsonLike<JSONPrimitive | Date>, string> = (
  value
) => {
  return typeof value === "string"
    ? value
    : value instanceof Date
    ? value.toJSON()
    : JSON.stringify(value);
};

export const toTrimmed: Transform<string, string> = (value) =>
  value.trim() || null;

export function toReplaced(
  pattern: string | RegExp,
  replacement: string
): Transform<string, string> {
  return (value) => value.replace(pattern, replacement) || null;
}

export const toCapitalized: Transform<string, string> = (value) =>
  value.toLocaleLowerCase().replace(/\b\w/g, (l) => l.toUpperCase()) || null;

export const toMimeType: Transform<string, string> = (value) =>
  mime.getType(value);

export const toDate: Transform<string, Date> = (value) =>
  chrono.casual.parseDate(value) ?? chrono.ru.casual.parseDate(value);
