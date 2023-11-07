import { isArray, isObject } from "@/lib/guards";

export type JsonLike<V> = V | Array<JsonLike<V>> | { [k: string]: JsonLike<V> };

export type ResolvedJsonLike<R> = R | Array<R> | Record<string, R>;

export type JsonLikeVisitor<V, R> = (value: V | ResolvedJsonLike<R>) => R;

export function traverseJsonLike<V, R>(
  visitor: JsonLikeVisitor<V, R>,
  value: JsonLike<V>
): R {
  if (isArray(value)) {
    const tmp = new Array<R>(value.length);
    for (let i = 0; i < value.length; i++) {
      tmp[i] = traverseJsonLike(visitor, value[i]);
    }
    return visitor(tmp);
  }
  if (isObject(value)) {
    const tmp: Record<string, R> = {};
    for (const [key, val] of Object.entries(value)) {
      tmp[key] = traverseJsonLike(visitor, val);
    }
    return visitor(tmp);
  }
  return visitor(value);
}
