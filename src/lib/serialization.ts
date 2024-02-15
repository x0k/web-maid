import { traverseJsonLikeWithGuard } from "@/lib/json-like-traverser";
import { isWindow } from "@/lib/guards";

export function isUnSerializable(value: unknown): boolean {
  return (
    value instanceof Error ||
    value instanceof Blob ||
    value instanceof Date ||
    value instanceof Node ||
    value instanceof ImageData ||
    value instanceof File ||
    value instanceof Image ||
    value instanceof ArrayBuffer ||
    value instanceof URL ||
    value instanceof URLSearchParams ||
    value instanceof FormData ||
    value instanceof Promise ||
    value instanceof ReadableStream ||
    isWindow(value)
  );
}

export function prepareForSerialization<T>(value: T): T {
  return traverseJsonLikeWithGuard(
    isUnSerializable as (value: unknown) => value is T,
    (v): T => {
      if (v instanceof Node) {
        return {
          nodeType: v.nodeType,
          nodeName: v.nodeName,
        } as T;
      }
      if (v instanceof Error) {
        return {
          name: v.name,
          message: v.message,
          stack: v.stack,
        } as T;
      }
      if (isWindow(v)) {
        return {
          name: v.name,
          location: v.location.toString(),
        } as T;
      }
      if (typeof v === "function") {
        return v.toString() as T;
      }
      return v as T;
    },
    value
  );
}
