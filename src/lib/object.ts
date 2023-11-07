import { isObject } from "@/lib/guards";
import { JsonLike } from "./json-like-traverser";

export type PrimitiveKey = string | number;

export type ComposedKey = PrimitiveKey | PrimitiveKey[];

export function get<T>(
  key: ComposedKey,
  from: JsonLike<T>,
  defaultValue?: T
): JsonLike<T> {
  if (Array.isArray(key)) {
    let result = from;
    for (const k of key) {
      if (Array.isArray(result) && typeof k === "number") {
        result = result[k];
        continue;
      }
      if (isObject(result)) {
        result = result[k];
        continue;
      }
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(
        `Invalid container type "${typeof result}: ${result}", expected an array or object`
      );
    }
    return result;
  }
  if (Array.isArray(from) && typeof key === "number") {
    return from[key];
  }
  if (isObject(from)) {
    return from[key];
  }
  if (defaultValue !== undefined) {
    return defaultValue;
  }
  throw new Error(`Value not found for key "${key}"`);
}
