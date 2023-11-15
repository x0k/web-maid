import makeUrlRegExp from "url-regex-safe";
import isRelUrl from "is-relative-url";

import { Transform, flow } from "./core";
import { toMimeType, toTrimmed } from "./converters";

const urlRegExp = makeUrlRegExp({
  parens: true,
  exact: true,
});

const AUTHOR_MAX_LENGTH = 100;

export function not<T, R>(transform: Transform<T, R>): Transform<T, T> {
  return (value: T) => (transform(value) === null ? value : null);
}

export const isUrl: Transform<string, string> = (value) =>
  urlRegExp.test(value) ? value : null;

export const isRelativeUrl: Transform<string, string> = (value) =>
  isRelUrl(value) ? value : null;

export function isSatisfies<T>(
  predicate: (value: T) => boolean
): Transform<T, T> {
  return (value) => (predicate(value) ? value : null);
}

export function isMatches(pattern: RegExp): Transform<string, string> {
  return (value) => (pattern.test(value) ? value : null);
}

export const isImageUrl: Transform<string, string> = (value) => {
  const mimeType = toMimeType(value);
  return mimeType && (/(image|video)/.test(mimeType) ? value : null);
};

export const isString: Transform<unknown, string> = (value) =>
  typeof value === "string" ? value : null;

export const isAuthor = flow(
  toTrimmed,
  not(isUrl),
  not(isRelativeUrl),
  isSatisfies((value) => value.length < AUTHOR_MAX_LENGTH)
);
