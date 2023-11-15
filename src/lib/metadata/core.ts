import { makeOptionFlow } from "@/lib/function/option-flow";
import { makeTryForEach } from "@/lib/function/try-for-each";
import { isNull } from "@/lib/guards";

export type Transform<T, R> = (value: T) => R | null;

export const flow = makeOptionFlow(isNull);

export const tryForEach = makeTryForEach(isNull, null);

export const BY_AUTHOR_REGEX = /^[\s\n]*by[\s\n]+|@[\s\n]*/i;
export const LOCATION_REGEX = /^[A-Z\s]+\s+[-—–]\s+/;
export const TITLE_SEPARATOR_REGEX = /(^[\s|\\/•—-]+)|([\s|\\/•—-]+$)/g;
export const STRICT_AUTHOR_REGEX = /^\S+\s+\S+/;
