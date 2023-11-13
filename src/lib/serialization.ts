import { traverseJsonLike } from "@/lib/json-like-traverser";

export function prepareForSending<T>(value: T): T {
  return traverseJsonLike((v): T => {
    if (typeof v === "function") {
      return v.toString() as T;
    }
    return v as T;
  }, value);
}
