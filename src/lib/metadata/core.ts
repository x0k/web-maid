import { makeOptionFlow } from '../function/option-flow';
import { makeTryForEach } from "../function/try-for-each";
import { isNull } from "../guards";

export type Transform<T, R> = (value: T) => R | null;

export const flow = makeOptionFlow(isNull);

export const tryForEach = makeTryForEach(isNull, null);
