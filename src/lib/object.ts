import { isObject } from "@/lib/guards";

export type PrimitiveKey = string | number;

export type ComposedKey = PrimitiveKey | PrimitiveKey[];

export type Decr = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export type ValuesOf<T, D extends number = 3> = D extends 0
  ? T
  :
      | T
      | (T extends Array<infer U>
          ? ValuesOf<U, Decr[D]>
          : T extends Record<string, infer U>
          ? ValuesOf<U, Decr[D]>
          : T extends object
          ? { [k in keyof T]: ValuesOf<T[k], Decr[D]> }[keyof T]
          : never);

export function get<T, D extends number = 3>(
  key: ComposedKey,
  from: T,
  defaultValue?: ValuesOf<T, D>
): ValuesOf<T, D> {
  if (Array.isArray(key)) {
    let result = from as unknown;
    for (const k of key) {
      if (Array.isArray(result) && typeof k === "number") {
        if (k >= 0 && k < result.length) {
          result = result[k];
          continue;
        }
      } else if (isObject(result) && k in result) {
        result = result[k];
        continue;
      }
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(
        `Invalid container type "${typeof result}: ${result}" for key "${k}", expected an array or object`
      );
    }
    return result as ValuesOf<T, D>;
  }
  if (Array.isArray(from) && typeof key === "number" && key >= 0 && key < from.length) {
    return from[key];
  }
  if (isObject<ValuesOf<T, D>>(from) && key in from) {
    return from[key];
  }
  if (defaultValue !== undefined) {
    return defaultValue;
  }
  throw new Error(`Value not found for key "${key}"`);
}

export function assignWithPrefix<V>(
  prefix: string,
  target: Record<string, V>,
  source: Record<string, V>
): Record<string, V> {
  for (const [key, value] of Object.entries(source)) {
    target[`${prefix}${key}`] = value;
  }
  return target;
}
