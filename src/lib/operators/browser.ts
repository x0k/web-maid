import { z } from "zod";
import { Readability } from "@mozilla/readability";
import Turndown from "turndown";

import { ScopedOpFactory, TaskOpFactory } from "@/lib/operator";
import { get } from "@/lib/object";
import { jsonSchema } from "@/lib/zod";
import { evalInScope } from "@/lib/eval";
import { neverError } from "@/lib/guards";
import { extractMetadata, Metadata } from "@/lib/metascraper";

export abstract class BrowserFactory<
  Z extends z.ZodType,
  R
> extends TaskOpFactory<Z, R> {
  constructor(
    protected readonly window: Window,
    protected readonly document: Document
  ) {
    super();
  }
}

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
    const value = get<Document, 1>(key, this.document);
    if (value !== undefined) {
      return jsonSchema.parse(value);
    }
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Value not found for key "${key}"`);
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
  private evalScope = {
    window: this.window,
    document: this.document,
  };
  execute({
    expression,
    default: defaultValue,
  }: z.TypeOf<this["schema"]>): unknown {
    if (defaultValue === undefined) {
      return evalInScope(expression, this.evalScope);
    }
    try {
      return evalInScope(expression, this.evalScope);
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
        const node = this.document.createElement("div");
        node.appendChild(content.cloneNode(true));
        return node.innerHTML;
      }
      default:
        throw neverError(as, "Invalid selection type");
    }
  }
}

const readabilityConfig = z.object({
  baseUrl: z.string(),
  html: z.string(),
  default: z.unknown().default(""),
});

export class ReadabilityOpFactory extends BrowserFactory<
  typeof readabilityConfig,
  unknown
> {
  readonly schema = readabilityConfig;
  execute({
    baseUrl,
    html,
    default: defaultValue,
  }: z.TypeOf<this["schema"]>): unknown {
    const tmpDoc = this.document.implementation.createHTMLDocument();
    const base = this.document.createElement("base");
    base.href = baseUrl;
    tmpDoc.head.appendChild(base);
    tmpDoc.body.innerHTML = html;
    const reader = new Readability(tmpDoc);
    const article = reader.parse();
    return article === null ? defaultValue : article;
  }
}

const html2MarkdownConfig = z.object({
  html: z.string(),
  options: z.record(z.string()).default({
    headingStyle: "atx",
    hr: "---",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "*",
  }),
});

export class SimplifyHtmlOpFactory extends ReadabilityOpFactory {
  execute(config: z.TypeOf<this["schema"]>): unknown {
    const result = super.execute(config);
    if (typeof result === "object" && result !== null && "content" in result) {
      return result.content;
    }
    return result;
  }
}

export class Html2MarkdownOpFactory extends BrowserFactory<
  typeof html2MarkdownConfig,
  string
> {
  readonly schema = html2MarkdownConfig;
  execute({ html, options }: z.TypeOf<this["schema"]>): string {
    const turndown = new Turndown(options);
    return turndown.turndown(html);
  }
}

const htmlMetadataConfig = z.object({
  html: z.string(),
  url: z.string().url().optional(),
});

export class HtmlMetadataOpFactory extends BrowserFactory<
  typeof htmlMetadataConfig,
  Metadata
> {
  readonly schema = htmlMetadataConfig;
  execute({ html }: z.TypeOf<this["schema"]>): Promise<Metadata> {
    return extractMetadata({ html, url: this.document.location.href });
  }
}

export function browserOperatorsFactories(
  window: Window,
  document: Document
): Record<string, ScopedOpFactory<unknown>> {
  return {
    document: new DocumentOpFactory(window, document),
    jsEval: new JsEvalOpFactory(window, document),
    selection: new SelectionOpFactory(window, document),
    readability: new ReadabilityOpFactory(window, document),
    simplifyHtml: new SimplifyHtmlOpFactory(window, document),
    html2md: new Html2MarkdownOpFactory(window, document),
    htmlMetadata: new HtmlMetadataOpFactory(window, document),
  };
}
