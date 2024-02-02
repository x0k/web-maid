import { z } from "zod";

import { get } from "@/lib/object";
import { jsonSchema } from "@/lib/zod";
import { neverError } from "@/lib/guards";
import { AsyncFactory } from "@/lib/factory";

import { BrowserFactory } from "./shared/browser-factory";

const primitiveKeyConfig = z.union([z.string(), z.number().int()]);

const composedKeyConfig = z.union([
  primitiveKeyConfig,
  z.array(primitiveKeyConfig),
]);

const documentConfig = z.object({
  key: composedKeyConfig,
  default: z.unknown().optional(),
});

export class GetOpFactory extends BrowserFactory<
  typeof documentConfig,
  unknown
> {
  name = "get";
  readonly schema = documentConfig;
  constructor(window: Window) {
    super(window);
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  key: string | number | (string | number)[];
  default?: unknown;
}`,
          returns: "<json>",
          description:
            "Returns a value from `document` and validates it as `<json>`. \
Follows the same rules as `get` operator.",
        },
      ];
      this.examples = [
        {
          description: "Get document title",
          code: `$op: doc.get
key: title`,
          result: `<current document title>`,
        },
        {
          description: "Get current URL",
          code: `$op: doc.get
key:
  - location
  - href`,
          result: `<current document URL>`,
        },
        {
          description: "Get document HTML",
          code: `$op: doc.get
key:
  - documentElement
  - outerHTML`,
          result: `<current document HTML>`,
        },
      ];
    }
  }
  execute({ key, default: defaultValue }: z.TypeOf<this["schema"]>): unknown {
    const value = get(key, this.window.document, defaultValue);
    return jsonSchema.parse(value);
  }
}

const injectAsConfig = z.enum(["context", "scope"]).default("context");
const jsEvalConfig = z.object({
  expression: z.string(),
  data: z.unknown().default({}),
  injectAs: injectAsConfig,
  default: z.unknown().optional(),
});

export interface EvaluatorData {
  expression: string;
  data: unknown
  injectAs: "context" | "scope";
}

export class JsEvalOpFactory extends BrowserFactory<
  typeof jsEvalConfig,
  unknown
> {
  name = "eval";
  readonly schema = jsEvalConfig;
  constructor(
    window: Window,
    private readonly evaluator: AsyncFactory<EvaluatorData, unknown>
  ) {
    super(window);
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  expression: string
  /** @default {} */
  data?: unknown
  /** @default "context" */
  injectAs?: "context" | "scope"
  default?: any
}`,
          returns: "unknown",
          description:
            "Evaluates an javascript expression and returns its result. \
Since the `eval` is blocked by CSP, evaluation is performed in an isolated sandbox. \
If during the execution of the expression an error occurs, the `default` value is returned.\n\n\
There are several ways to inject `data` into the expression:\n\n\
- `context` - the provided `data` will be available by `this` keyword.\n\
- `scope` - the values of provided `data` will be implicitly available in the expression.",
        },
      ];
      this.examples = [
        {
          description: "Inject as context",
          code: `$op: doc.eval
expression: return this.key + 1
data:
  key: 1`,
          result: "2",
        },
        {
          description: "Inject as scope",
          code: `$op: doc.eval
expression: return key + 1
injectAs: scope
data:
  key: 1`,
          result: "2",
        },
      ];
    }
  }

  async execute({
    expression,
    data,
    injectAs,
    default: defaultValue,
  }: z.TypeOf<this["schema"]>): Promise<unknown> {
    try {
      return await this.evaluator.Create({
        expression,
        data,
        injectAs,
      });
    } catch (error) {
      console.error(error);
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw error;
    }
  }
}

const selectionConfig = z.object({
  as: z.enum(["text", "html"]).default("text"),
  default: z.unknown().default(""),
});

export class SelectionOpFactory extends BrowserFactory<
  typeof selectionConfig,
  unknown
> {
  name = "selection";
  readonly schema = selectionConfig;
  constructor(window: Window) {
    super(window);
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config<D> {
  /** @default "text" */
  as?: "text" | "html";
  /** @default "" */
  default?: D | string;
}`,
          returns: "D | string",
          description:
            "Returns the selection of current document in `text` or `html` format. \
If the selection is empty, the `default` value is returned.",
        },
      ];
    }
  }
  execute({ as, default: defaultValue }: z.TypeOf<this["schema"]>): unknown {
    const selection = this.window.getSelection();
    if (selection === null) {
      return defaultValue;
    }
    switch (as) {
      case "text":
        return selection.toString();
      case "html": {
        const content = selection.getRangeAt(0).cloneContents();
        const node = this.window.document.createElement("div");
        node.appendChild(content.cloneNode(true));
        return node.innerHTML;
      }
      default:
        throw neverError(as, "Invalid selection type");
    }
  }
}

export function documentOperatorsFactories(
  window: Window,
  evaluator: AsyncFactory<EvaluatorData, unknown>
) {
  return [
    new GetOpFactory(window),
    new JsEvalOpFactory(window, evaluator),
    new SelectionOpFactory(window),
  ];
}
