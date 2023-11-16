import { Transform } from "./core";

export function isSatisfies<T>(
  predicate: (value: T) => boolean
): Transform<T, T>;
export function isSatisfies<T>(
  guard: (value: unknown) => value is T
): Transform<unknown, T>;
export function isSatisfies<T>(
  predicate: (value: T) => boolean
): Transform<T, T> {
  return (value) => (predicate(value) ? value : null);
}

export const isTransforms = <T, R>(transform: Transform<T, R>) =>
  isSatisfies<T>((v) => transform(v) !== null);

export const not = <T, R>(transform: Transform<T, R>) =>
  isSatisfies<T>((v) => transform(v) === null);

export const isMatches = (pattern: RegExp) =>
  isSatisfies((v: string) => pattern.test(v));
