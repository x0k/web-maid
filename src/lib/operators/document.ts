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

export class DocumentOpFactory extends BrowserFactory<
  typeof documentConfig,
  unknown
> {
  readonly schema = documentConfig;
  execute({ key, default: defaultValue }: z.TypeOf<this["schema"]>): unknown {
    const value = get(key, this.window.document, defaultValue);
    return jsonSchema.parse(value);
  }
}

const jsEvalConfig = z.object({
  expression: z.string(),
  default: z.unknown().optional(),
});

export class JsEvalOpFactory extends BrowserFactory<
  typeof jsEvalConfig,
  unknown
> {
  readonly schema = jsEvalConfig;

  constructor(
    window: Window,
    private readonly evaluator: AsyncFactory<string, unknown>
  ) {
    super(window);
  }

  async execute({
    expression,
    default: defaultValue,
  }: z.TypeOf<this["schema"]>): Promise<unknown> {
    if (defaultValue === undefined) {
      return this.evaluator.Create(expression);
    }
    try {
      return await this.evaluator.Create(expression);
    } catch (e) {
      console.error(e);
      return defaultValue;
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
  readonly schema = selectionConfig;
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
  evaluator: AsyncFactory<string, unknown>
) {
  return {
    get: new DocumentOpFactory(window),
    eval: new JsEvalOpFactory(window, evaluator),
    selection: new SelectionOpFactory(window),
  };
}
