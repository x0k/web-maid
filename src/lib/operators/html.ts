import { Readability } from "@mozilla/readability";
import Turndown from "turndown";
import { z } from "zod";

import { title } from "@/lib/metadata/title";
import { description } from "@/lib/metadata/description";
import { modifiedDate, publishedDate, unknownDate } from "@/lib/metadata/date";
import { image } from "@/lib/metadata/image";
import { author } from "@/lib/metadata/author";

import { BrowserFactory } from "./shared/browser-factory";

const readabilityConfig = z.object({
  html: z.string(),
  baseUrl: z.string().optional(),
  default: z.unknown().default(""),
});

export class ReadabilityOpFactory extends BrowserFactory<
  typeof readabilityConfig,
  unknown
> {
  name = "readability";
  schema = readabilityConfig;
  constructor(readonly window: Window) {
    super(window);
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config<D> {
  html: string;
  baseUrl?: string;
  /** @default "" */
  default?: D | string;
}`,
          returns: `{
  /** article title */
  title: string;
  /** HTML string of processed article content */
  content: T;
  /** text content of the article, with all the HTML tags removed */
  textContent: string;
  /** length of an article, in characters */
  length: number;
  /** article description, or short excerpt from the content */
  excerpt: string;
  /** author metadata */
  byline: string;
  /** content direction */
  dir: string;
  /** name of the site */
  siteName: string;
  /** content language */
  lang: string;
} | D | string"`,
          description: "Returns an article object.",
        },
      ];
    }
  }
  execute({
    html,
    baseUrl,
    default: defaultValue,
  }: z.TypeOf<this["schema"]>): unknown {
    const tmpDoc = this.window.document.implementation.createHTMLDocument();
    const base = this.window.document.createElement("base");
    base.href = baseUrl ?? this.window.location.href;
    tmpDoc.head.appendChild(base);
    tmpDoc.body.innerHTML = html;
    const reader = new Readability(tmpDoc);
    const article = reader.parse();
    return article === null ? defaultValue : article;
  }
}

export class SimplifyHtmlOpFactory extends ReadabilityOpFactory {
  name = "simplify";
  constructor(readonly window: Window) {
    super(window);
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config<D> {
  html: string;
  baseUrl?: string;
  default?: D | string;
}`,
          returns: `D | string`,
          description: "Returns a content of article object.",
        },
      ];
    }
  }
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
  name = "markdown";
  schema = html2MarkdownConfig;
  constructor(readonly window: Window) {
    super(window);
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  html: string;
  /** @default {
    headingStyle: "atx",
    hr: "---",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "*",
  } */
  options?: {
    headingStyle?: "setext" | "atx" | undefined;
    hr?: string | undefined;
    br?: string | undefined;
    bulletListMarker?: "-" | "+" | "*" | undefined;
    codeBlockStyle?: "indented" | "fenced" | undefined;
    emDelimiter?: "_" | "*" | undefined;
    fence?: "\`\`\`" | "~~~" | undefined;
    strongDelimiter?: "__" | "**" | undefined;
    linkStyle?: "inlined" | "referenced" | undefined;
    linkReferenceStyle?: "full" | "collapsed" | "shortcut" | undefined;
  }
}`,
          returns: "string",
          description: "Converts HTML to Markdown.",
        },
      ];
    }
  }
  execute({ html, options }: z.TypeOf<this["schema"]>): string {
    const turndown = new Turndown(options);
    return turndown.turndown(html);
  }
}

const metadataConfig = z.object({
  html: z.string(),
});

export class MetadataOpFactory extends BrowserFactory<
  typeof metadataConfig,
  unknown
> {
  name = "metadata";
  schema = metadataConfig;
  constructor(readonly window: Window) {
    super(window);
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  html: string
}`,
          returns: `{
  title: string | null
  description: string | null
  modifiedDate: string | null
  publishedDate: string | null
  date: string | null
  image: string | null
  author: string | null
}`,
          description: "Returns a HTML page metadata.",
        },
      ];
    }
  }
  execute({ html }: z.TypeOf<this["schema"]>): unknown {
    const root = new DOMParser().parseFromString(html, "text/html");
    return {
      title: title(root),
      description: description(root),
      modifiedDate: modifiedDate(root),
      publishedDate: publishedDate(root),
      date: unknownDate(root),
      image: image(this.window.location.origin)(root),
      author: author(root),
    };
  }
}

export function htmlOperatorsFactories(window: Window) {
  return [
    new ReadabilityOpFactory(window),
    new SimplifyHtmlOpFactory(window),
    new Html2MarkdownOpFactory(window),
    new MetadataOpFactory(window),
  ];
}
