import jp from "jsonpath";

import { JSONValue } from "@/lib/json";

import { Transform } from "./core";
import { optionFlow } from "../function";
import { isNull } from "../guards";

export function query(selector: string): Transform<Element, Element> {
  return (element) => element.querySelector(selector);
}

export function queryAll(selector: string): Transform<Element, Element[]> {
  return (element) => Array.from(element.querySelectorAll(selector));
}

export function attr(selector: string): Transform<Element, string> {
  return (element) => element.getAttribute(selector);
}

export const innerHTML: Transform<Element, string> = (element) => {
  return element.innerHTML.trim() || null;
};

export const textContent: Transform<Element, string> = (element) => {
  return element.textContent?.trim() || null;
};

export const fromJSON: Transform<string, JSONValue> = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export function jsonQueryAll(
  selector: string
): Transform<JSONValue, JSONValue[]> {
  return (value) => jp.query(value, selector);
}

export function jsonQuery(selector: string): Transform<JSONValue, JSONValue> {
  return (value) => {
    const values = jp.value(value, selector);
    return values.length > 0 ? values[0] : null;
  };
}

export function find<T>(predicate: (v: T) => boolean): Transform<T[], T> {
  return (value) => value.find(predicate) ?? null;
}

export const queryAttr = (selector: string, attribute: string) =>
  optionFlow(isNull, query(selector), attr(attribute));

export function findAndExtract<T, R>(
  extract: Transform<T, R>
): Transform<T[], R> {
  return (value) => {
    for (let i = 0; i < value.length; i++) {
      const result = extract(value[i]);
      if (result !== null) {
        return result;
      }
    }
    return null;
  };
}

export const queryTextContent = (selector: string) =>
  optionFlow(isNull, query(selector), textContent);
