import { traverseJsonLikeWithGuard } from "@/lib/json-like-traverser";

function isWindow(value: unknown): value is Window {
  return (
    typeof value === "object" &&
    value !== null &&
    "window" in value &&
    value.window === value
  );
}

export function prepareForSerialization<T>(value: T): T {
  return traverseJsonLikeWithGuard(
    (v): v is T => {
      return (
        v instanceof Error ||
        v instanceof Node ||
        v instanceof Blob ||
        isWindow(v)
      );
    },
    (v): T => {
      if (v instanceof Blob) {
        return v as T;
      }
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
