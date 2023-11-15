import { traverseJsonLikeWithGuard } from "@/lib/json-like-traverser";

export function prepareForSending<T>(value: T): T {
  return traverseJsonLikeWithGuard(
    (v): v is T => {
      return v instanceof Error
    },
    (v): T => {
      if (v instanceof Error) {
        return {
          name: v.name,
          message: v.message,
          stack: v.stack,
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
