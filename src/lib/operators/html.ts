import { Readability } from "@mozilla/readability";
import Turndown from "turndown";
import { z } from "zod";

import { BrowserFactory } from "./shared/browser-factory";

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
    const tmpDoc = this.window.document.implementation.createHTMLDocument();
    const base = this.window.document.createElement("base");
    base.href = baseUrl;
    tmpDoc.head.appendChild(base);
    tmpDoc.body.innerHTML = html;
    const reader = new Readability(tmpDoc);
    const article = reader.parse();
    return article === null ? defaultValue : article;
  }
}

export class SimplifyHtmlOpFactory extends ReadabilityOpFactory {
  execute(config: z.TypeOf<this["schema"]>): unknown {
    const result = super.execute(config);
    if (typeof result === "object" && result !== null && "content" in result) {
      return result.content;
    }
    return result;
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

export function htmlOperatorsFactories(window: Window) {
  return {
    readability: new ReadabilityOpFactory(window),
    simplify: new SimplifyHtmlOpFactory(window),
    markdown: new Html2MarkdownOpFactory(window),
  };
}
