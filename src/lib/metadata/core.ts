import { makeOptionFlow } from "@/lib/function/option-flow";
import { makeTryForEach } from "@/lib/function/try-for-each";
import { isNull } from "@/lib/guards";

export type Transform<T, R> = (value: T) => R | null;

export const flow = makeOptionFlow(isNull);

export const tryForEach = makeTryForEach(isNull, null);
