import { makeTryForEach2 } from "../function/try-for-each";
import { isNull } from "../guards";

export type Transform<T, R> = (value: T) => R | null;

export const tryForEach = makeTryForEach2(isNull, null);
