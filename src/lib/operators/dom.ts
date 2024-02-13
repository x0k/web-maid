import { z } from "zod";

import {
  TaskOpFactory,
  contextDefaultedFieldPatch,
} from "@/lib/operator";
import { neverError } from "@/lib/guards";
import { get } from '@/lib/object';

import { BrowserFactory } from "./shared/browser-factory";

const documentConfig = z.unknown();
const elementConfig = z.custom<HTMLElement>(
  (value) => value instanceof HTMLElement
)

export class DocumentOpFactory extends BrowserFactory<
  typeof documentConfig,
  Document
> {
  name = "document";
  schema = documentConfig;
  constructor(window: Window) {
    super(window);
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: "void",
          returns: "Document",
          description: "Returns the current document",
        },
      ];
    }
  }
  protected execute(): Document {
    return this.window.document;
  }
}

const elementOrDocumentConfig = z.custom<Document | HTMLElement>(
  (value) => value instanceof HTMLElement || value instanceof Document
);

const queryConfig = z.object({
  element: elementOrDocumentConfig,
  query: z.string(),
});

export class QueryOpFactory extends TaskOpFactory<
  typeof queryConfig,
  Element | null
> {
  name = "query";
  schema = queryConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  /** @default <context> */
  element?: Document | HTMLElement
  query: string
}`,
          returns: `Element | null`,
          description:
            "Returns descendant element of `element` that matches `query`.",
        },
      ];
    }
  }

  patchConfig = contextDefaultedFieldPatch("element");
  protected execute({
    query,
    element,
  }: z.TypeOf<this["schema"]>): Element | null {
    return element.querySelector(query);
  }
}

export class QueryAllOpFactory extends TaskOpFactory<
  typeof queryConfig,
  Element[]
> {
  name = "queryAll";
  schema = queryConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  /** @default <context> */
  element?: Document | HTMLElement
  query: string
}`,
          returns: `Element[]`,
          description:
            "Returns all element descendants of `element` that match `query`.",
        },
      ];
    }
  }

  patchConfig = contextDefaultedFieldPatch("element");
  protected execute({ query, element }: z.TypeOf<this["schema"]>): Element[] {
    return Array.from(element.querySelectorAll(query));
  }
}

const siblingsConfig = z.object({
  element: elementConfig,
  kind: z.enum(["all", "previous", "next"]).default("all"),
});

export class SiblingsOpFactory extends TaskOpFactory<
  typeof siblingsConfig,
  Element[]
> {
  name = "siblings";
  schema = siblingsConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  /** @default <context> */
  element?: HTMLElement
  /** @default "all" */
  kind?: "all" | "previous" | "next"
}`,
          returns: `Element[]`,
          description: "Returns the siblings of `element`.",
        },
      ];
    }
  }
  patchConfig = contextDefaultedFieldPatch("element");
  protected execute({ element, kind }: z.TypeOf<this["schema"]>): Element[] {
    switch (kind) {
      case "all":
        return Array.from(element.parentElement?.children ?? []).filter(
          (child) => child !== element
        );
      case "previous": {
        const sibs = [];
        let el = element.previousElementSibling;
        while (el) {
          sibs.push(el);
          el = el.previousElementSibling;
        }
        return sibs;
      }
      case "next": {
        const sibs = [];
        let el = element.nextElementSibling;
        while (el) {
          sibs.push(el);
          el = el.nextElementSibling;
        }
        return sibs;
      }
      default:
        throw neverError(kind, "Invalid kind");
    }
  }
}

const siblingConfig = z.object({
  element: elementConfig,
  kind: z.enum(["previous", "next"]).default("next"),
});

export class SiblingOpFactory extends TaskOpFactory<
  typeof siblingConfig,
  Element | null
> {
  name = "sibling";
  schema = siblingConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  /** @default <context> */
  element?: HTMLElement
  /** @default "next" */
  kind?: "previous" | "next"
}`,
          returns: `Element | null`,
          description: "Returns the previous or next sibling of `element`.",
        },
      ];
    }
  }

  patchConfig = contextDefaultedFieldPatch("element");
  protected execute({
    element,
    kind,
  }: z.TypeOf<this["schema"]>): Element | null {
    switch (kind) {
      case "previous":
        return element.previousElementSibling;
      case "next":
        return element.nextElementSibling;
      default:
        throw neverError(kind, "Invalid kind");
    }
  }
}

const closestConfig = z.object({
  element: elementConfig,
  query: z.string(),
});

export class ClosestOpFactory extends TaskOpFactory<
  typeof closestConfig,
  Element | null
> {
  name = "closest";
  schema = closestConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  /** @default <context> */
  element?: HTMLElement
  query: string
}`,
          returns: `Element | null`,
          description: "Returns the closest element that matches `query`.",
        },
      ];
    }
  }
  patchConfig = contextDefaultedFieldPatch("element");
  protected execute(config: z.TypeOf<this["schema"]>): Element | null {
    return config.element.closest(config.query);
  }
}

const parentsUntilConfig = z.object({
  element: elementConfig,
  predicate: z.function(),
});

export class ParentsUntilOpFactory extends TaskOpFactory<
  typeof parentsUntilConfig,
  Element[]
> {
  name = "parentsUntil";
  schema = parentsUntilConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  /** @default <context> */
  element?: HTMLElement
  predicate: (element: HTMLElement) => boolean
}`,
          returns: `Element[]`,
          description:
            "Returns the first parent element that matches `predicate`.",
        },
      ];
    }
  }
  patchConfig = contextDefaultedFieldPatch("element");
  protected execute({
    element,
    predicate,
  }: z.TypeOf<this["schema"]>): Element[] {
    const parents = [];
    let el = element.parentElement;
    while (el && !predicate(el)) {
      parents.push(el);
      el = el.parentElement;
    }
    return parents;
  }
}

const primitiveKeyConfig = z.union([z.string(), z.number().int()]);

const composedKeyConfig = z.union([
  primitiveKeyConfig,
  z.array(primitiveKeyConfig),
]);

const getConfig = z.object({
  element: elementConfig,
  key: composedKeyConfig,
  default: z.unknown().optional(),
});

export class GetOpFactory extends TaskOpFactory<typeof getConfig, unknown> {
  name = "get";
  schema = getConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  /** @default <context> */
  element?: HTMLElement
  key: string | number | (string | number)[]
  default?: unknown
}`,
          returns: "unknown",
          description:
            "Returns a value from `element`. \
Follows the same rules as `get` operator.",
        },
      ];
    }
  }
  patchConfig = contextDefaultedFieldPatch("element");
  protected execute({
    element,
    key,
    default: defaultValue,
  }: z.TypeOf<this["schema"]>): unknown {
    return get(key, element, defaultValue);
  }
}

export function domOperatorsFactories(window: Window) {
  return [
    new DocumentOpFactory(window),
    new QueryOpFactory(),
    new QueryAllOpFactory(),
    new SiblingOpFactory(),
    new ClosestOpFactory(),
    new ParentsUntilOpFactory(),
    new GetOpFactory(),
  ]
}
