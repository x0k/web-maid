import { z } from "zod";
import { Readability } from "@mozilla/readability";
import Turndown from "turndown";

import { TaskOpFactory, OpFactory, OpOrVal } from "@/lib/operator";
import { get } from "@/lib/object";
import { jsonSchema } from "@/lib/zod";
import { evalInScope } from "@/lib/eval";
import { neverError } from "@/lib/guards";
import { extractMetadata } from "../metascraper";

export abstract class BrowserFactory<
  Z extends z.ZodType
> extends TaskOpFactory<Z> {
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
  default: z.any().optional(),
});

export class DocumentOpFactory extends BrowserFactory<typeof documentConfig> {
  readonly schema = documentConfig;
  exec({ key, default: defaultValue }: z.TypeOf<this["schema"]>): OpOrVal {
    const value = get(key, this.document);
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
  default: z.any().optional(),
});

export class JsEvalOpFactory extends BrowserFactory<typeof jsEvalConfig> {
  readonly schema = jsEvalConfig;
  private evalScope = {
    window: this.window,
    document: this.document,
  };
  exec({
    expression,
    default: defaultValue,
  }: z.TypeOf<this["schema"]>): OpOrVal {
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
  default: z.any().default(""),
});

export class SelectionOpFactory extends BrowserFactory<typeof selectionConfig> {
  readonly schema = selectionConfig;
  exec({ as, default: defaultValue }: z.TypeOf<this["schema"]>): OpOrVal {
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
  default: z.any().default(""),
});

export class ReadabilityOpFactory extends BrowserFactory<
  typeof readabilityConfig
> {
  readonly schema = readabilityConfig;
  exec({
    baseUrl,
    html,
    default: defaultValue,
  }: z.TypeOf<this["schema"]>): OpOrVal {
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
  exec(config: z.TypeOf<this["schema"]>): OpOrVal {
    const result = super.exec(config);
    if (typeof result === "object" && result !== null && "content" in result) {
      return result.content;
    }
    return result;
  }
}

export class Html2MarkdownOpFactory extends BrowserFactory<
  typeof html2MarkdownConfig
> {
  readonly schema = html2MarkdownConfig;
  exec({ html, options }: z.TypeOf<this["schema"]>): OpOrVal {
    const turndown = new Turndown(options);
    return turndown.turndown(html);
  }
}

// const htmlMetadataConfig = z.object({
//   html: z.string(),
//   url: z.string().url().optional(),
// });

// export class HtmlMetadataOpFactory extends BrowserFactory<
//   typeof htmlMetadataConfig
// > {
//   readonly schema = htmlMetadataConfig;
//   exec({ html }: z.TypeOf<this["schema"]>): OpOrVal {
//     return extractMetadata({ html, url: this.document.location.href });
//   }
// }

export function browserOperatorsFactories(
  window: Window,
  document: Document
): Record<string, OpFactory> {
  return {
    document: new DocumentOpFactory(window, document),
    jsEval: new JsEvalOpFactory(window, document),
    selection: new SelectionOpFactory(window, document),
    readability: new ReadabilityOpFactory(window, document),
    simplifyHtml: new SimplifyHtmlOpFactory(window, document),
    html2md: new Html2MarkdownOpFactory(window, document),
  };
}
