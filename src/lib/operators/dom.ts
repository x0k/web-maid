import { z } from "zod";

import { FlowOpFactory, ScopedOp, TaskOpFactory, contextDefaultedFieldPatch, evalInScope } from "@/lib/operator";
import { neverError } from "@/lib/guards";

import { BrowserFactory } from "./shared/browser-factory";

const documentConfig = z.object({
  source: z.string().optional(),
  type: z.enum([
    "application/xhtml+xml",
    "application/xml",
    "image/svg+xml",
    "text/html",
    "text/xml",
  ]).default("text/html"),
});
const elementConfig = z.custom<HTMLElement>(
  (value) => value instanceof HTMLElement
);

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
          params: `interface Config {
  source?: string
  /** @default "text/html" */
  type?: "application/xhtml+xml" | "application/xml" | "image/svg+xml" | "text/html" | "text/xml"
}`,
          returns: "Document",
          description: "Returns the document instance.",
        },
      ];
    }
  }
  protected execute({ source, type }: z.TypeOf<this["schema"]>): Document {
    if (source) {
      const parser = new DOMParser();
      return parser.parseFromString(source, type);
    }
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
  element: z.unknown(),
  predicate: z.function(),
});

export class ParentsUntilOpFactory extends FlowOpFactory<
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
          description: "Return a list of parents elements.",
        },
      ];
    }
  }
  protected create ({ element, predicate }: z.TypeOf<this['schema']>): ScopedOp<Element[]> {
    return async (scope) => {
      const el = element ? await evalInScope(element, scope) : scope.context
      if (!(el instanceof HTMLElement)) {
        throw new Error("Element should be HTMLElement")
      }
      const parents: Element[] = []
      let parent = el.parentElement
      const mutableScope = { ...scope, context: parent }
      while (parent && !(await predicate(mutableScope))) {
        parents.push(parent)
        mutableScope.context = parent = parent.parentElement
      }
      return parents
    }
  }
}

const computedStyleConfig = z.object({
  element: elementConfig,
});

export class ComputedStyleOpFactory extends BrowserFactory<
  typeof computedStyleConfig,
  CSSStyleDeclaration
> {
  name = "computedStyle";
  schema = computedStyleConfig;
  constructor(window: Window) {
    super(window);
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  /** @default <context> */
  element?: HTMLElement
}`,
          returns: `CSSStyleDeclaration`,
          description: "Returns the computed style of `element`.",
        },
      ];
    }
  }
  patchConfig = contextDefaultedFieldPatch("element");
  protected execute({
    element,
  }: z.TypeOf<this["schema"]>): CSSStyleDeclaration {
    return this.window.getComputedStyle(element, null);
  }
}

const classListConfig = z.object({
  element: elementConfig,
  action: z.enum(["add", "remove", "toggle", "contains"]),
  className: z.string(),
});

export class ClassListOpFactory extends TaskOpFactory<
  typeof classListConfig,
  boolean
> {
  name = "classList";
  schema = classListConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  /** @default <context> */
  element?: HTMLElement
  action: "add"
  className: string
}`,
          returns: `boolean`,
          description:
            "Adds `className` to `element`, returns `true` if `className` is now present.",
        },
        {
          params: `interface Config {
  /** @default <context> */
  element?: HTMLElement
  action: "remove"
  className: string
}`,
          returns: `boolean`,
          description:
            "Removes `className` from `element`, returns `true` if `className` is now absent.",
        },
        {
          params: `interface Config {
  /** @default <context> */
  element?: HTMLElement
  action: "toggle"
  className: string
}`,
          returns: `boolean`,
          description:
            "Toggles `className` on `element`, returns `true` if `className` is now present.",
        },
        {
          params: `interface Config {
  /** @default <context> */
  element?: HTMLElement
  action: "contains"
  className: string
}`,
          returns: `boolean`,
          description: "Returns `true` if `className` is present.",
        },
      ];
    }
  }
  patchConfig = contextDefaultedFieldPatch("element");
  protected execute({
    element,
    action,
    className,
  }: z.TypeOf<this["schema"]>): boolean {
    const contains = element.classList.contains(className);
    switch (action) {
      case "add":
        element.classList.add(className);
        return !contains;
      case "remove":
        element.classList.remove(className);
        return contains;
      case "toggle":
        return element.classList.toggle(className);
      case "contains":
        return contains;
      default:
        throw neverError(action, "Invalid action");
    }
  }
}

const matchesConfig = z.object({
  element: elementConfig,
  query: z.string(),
});

export class MatchesOpFactory extends TaskOpFactory<
  typeof matchesConfig,
  boolean
> {
  name = "matches";
  schema = matchesConfig;
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
          returns: `boolean`,
          description: "Returns `true` if `element` matches `query`.",
        },
      ];
    }
  }
  patchConfig = contextDefaultedFieldPatch("element");
  protected execute({ element, query }: z.TypeOf<this["schema"]>): boolean {
    return element.matches(query);
  }
}

const xpathConfig = z.object({
  element: elementConfig,
  query: z.string(),
});

export class XPathOpFactory extends TaskOpFactory<
  typeof xpathConfig,
  Node | null
> {
  name = "xpath";
  schema = xpathConfig;
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
          returns: `Element`,
          description: "Returns the first element that matches `query`.",
        },
      ];
    }
  }
  patchConfig = contextDefaultedFieldPatch("element");
  protected execute({ element, query }: z.TypeOf<this["schema"]>): Node | null {
    return element.ownerDocument.evaluate(
      query,
      element,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;
  }
}

const xpathAllConfig = z.object({
  element: elementConfig,
  query: z.string(),
});

export class XPathAllOpFactory extends TaskOpFactory<
  typeof xpathAllConfig,
  Node[]
> {
  name = "xpathAll";
  schema = xpathAllConfig;
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
          returns: `Element[]`,
          description: "Returns all elements that match `query`.",
        },
      ];
    }
  }
  patchConfig = contextDefaultedFieldPatch("element");
  protected execute({ element, query }: z.TypeOf<this["schema"]>): Node[] {
    const result = element.ownerDocument.evaluate(
      query,
      element,
      null,
      XPathResult.ORDERED_NODE_ITERATOR_TYPE,
      null
    );
    const nodes = [];
    let node = result.iterateNext();
    while (node) {
      nodes.push(node);
      node = result.iterateNext();
    }
    return nodes;
  }
}

export function domOperatorsFactories(window: Window) {
  return [
    new DocumentOpFactory(window),
    new QueryOpFactory(),
    new QueryAllOpFactory(),
    new SiblingsOpFactory(),
    new SiblingOpFactory(),
    new ClosestOpFactory(),
    new ParentsUntilOpFactory(),
    new ComputedStyleOpFactory(window),
    new ClassListOpFactory(),
    new MatchesOpFactory(),
    new XPathOpFactory(),
    new XPathAllOpFactory(),
  ];
}
