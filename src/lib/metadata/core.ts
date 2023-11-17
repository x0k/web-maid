import makeUrlRegExp from "url-regex-safe";

import { makeOptionFlow } from "@/lib/function/option-flow";
import { makeTryForEach } from "@/lib/function/try-for-each";
import { isNull } from "@/lib/guards";
import { fallbackToDefault } from '@/lib/function/fallback';
import { identity } from '@/lib/function/function';

export type Transform<T, R> = (value: T) => R | null;

export const flow = makeOptionFlow(isNull);

export const tryForEach = makeTryForEach(isNull, null);

export const fallbackToIdentity = <T, R>(...transformers: Transform<T, R>[]) =>
  fallbackToDefault<[T], R | T | null>(null, ...transformers, identity);

export const URL_REGEX = makeUrlRegExp({
  parens: true,
  exact: true,
});
export const BY_AUTHOR_REGEX = /^[\s\n]*by[\s\n]+|@[\s\n]*/i;
export const LOCATION_REGEX = /^[A-Z\s]+\s+[-—–]\s+/;
export const TITLE_SEPARATOR_REGEX = /(^[\s|\\/•—-]+)|([\s|\\/•—-]+$)/g;
export const STRICT_AUTHOR_REGEX = /^\S+\s+\S+/;
export const IMAGE_OR_VIDEO_REGEX = /(image|video)/;
