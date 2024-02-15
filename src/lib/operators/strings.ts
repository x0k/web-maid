import { z } from "zod";
import { compressToEncodedURIComponent } from "lz-string";

import { TaskOpFactory, contextDefaultedFieldPatch } from "@/lib/operator";

const joinConfig = z.object({
  values: z.array(z.string()),
  separator: z.string().default(""),
});

export class JoinOpFactory extends TaskOpFactory<typeof joinConfig, string> {
  name = "join";
  readonly schema = joinConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  values: string[]
  /** @default "" */
  separator?: string
}`,
          returns: `string`,
          description: "Joins an array of strings.",
        },
      ];
    }
  }
  execute({ values, separator }: z.TypeOf<this["schema"]>): string {
    return values.join(separator);
  }
}

const replaceConfig = z.object({
  value: z.string(),
  pattern: z.string(),
  replacement: z.string(),
});

export class ReplaceOpFactory extends TaskOpFactory<
  typeof replaceConfig,
  string
> {
  name = "replace";
  schema = replaceConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  value: string
  pattern: string
  replacement: string
}`,
          returns: `string`,
          description: "Replaces `pattern` with `replacement`",
        },
      ];
    }
  }
  protected execute({
    value,
    pattern,
    replacement,
  }: z.TypeOf<this["schema"]>): string {
    return value.replace(pattern, replacement);
  }
}

export class ReplaceByRegExpOpFactory extends TaskOpFactory<
  typeof replaceConfig,
  string
> {
  name = "replaceByRegExp";
  schema = replaceConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  value: string
  pattern: string
  replacement: string
}`,
          returns: `string`,
          description: "Replaces global regexp `pattern` with `replacement`",
        },
      ];
    }
  }
  protected execute({
    value,
    pattern,
    replacement,
  }: z.TypeOf<this["schema"]>): string {
    return value.replace(new RegExp(pattern, "gu"), replacement);
  }
}

const matchConfig = z.object({
  value: z.string(),
  pattern: z.string(),
  flags: z.string().default(""),
  all: z.boolean().default(false),
});

export class MatchOpFactory extends TaskOpFactory<typeof matchConfig, unknown> {
  name = "match";
  schema = matchConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  value: string
  pattern: string
  flags?: string
  all?: boolean
}`,
          returns: `null | string[] | string[][]`,
          description:
            "Returns an array of matches of `pattern` in `value` with `flags`.\n\
Behaves like `javascript` `String.prototype.match` or `String.prototype.matchAll` when `all` is `true.",
        },
      ];
    }
  }

  protected execute({ value, pattern, flags, all }: z.TypeOf<this["schema"]>) {
    const regex = new RegExp(pattern, flags);
    if (all) {
      return [...value.matchAll(regex)];
    }
    return value.match(regex);
  }
}

const splitConfig = z.object({
  value: z.string(),
  separator: z.string(),
  limit: z.number().optional(),
});

export class SplitOpFactory extends TaskOpFactory<
  typeof splitConfig,
  string[]
> {
  name = "split";
  schema = splitConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  value: string
  separator: string
  limit?: number
}`,
          returns: `string[]`,
          description: "Splits `value` by `separator`",
        },
      ];
    }
  }
  protected execute({ value, separator, limit }: z.TypeOf<this["schema"]>) {
    return value.split(separator, limit);
  }
}

export class SplitByRegExpOpFactory extends TaskOpFactory<
  typeof splitConfig,
  string[]
> {
  name = "splitByRegExp";
  schema = splitConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  value: string
  separator: string
  limit?: number
}`,
          returns: `string[]`,
          description: "Splits `value` by regexp `separator`",
        },
      ];
    }
  }
  protected execute({ value, separator, limit }: z.TypeOf<this["schema"]>) {
    return value.split(new RegExp(separator), limit);
  }
}

const searchConfig = z.object({
  value: z.string(),
  pattern: z.string(),
  flags: z.string().default(""),
});

export class SearchOpFactory extends TaskOpFactory<
  typeof searchConfig,
  number
> {
  name = "search";
  schema = searchConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  value: string
  pattern: string
  flags?: string
}`,
          returns: `number`,
          description:
            "Returns the index of the first match of `pattern` in `value` with `flags`",
        },
      ];
    }
  }
  protected execute({ value, pattern, flags }: z.TypeOf<this["schema"]>) {
    const regex = new RegExp(pattern, flags);
    return value.search(regex);
  }
}

const formatEnum = z.enum(["encodedURIComponent"]);
const compressConfig = z.object({
  value: z.string(),
  format: formatEnum.default("encodedURIComponent"),
});

export class CompressOpFactory extends TaskOpFactory<
  typeof compressConfig,
  string
> {
  name = "compress";
  schema = compressConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  /** @default <context> */
  value?: string
  format?: 'encodedURIComponent'
}`,
          returns: `string`,
          description: "Compresses `value` as `format`.",
        },
      ];
      this.examples = [
        {
          description: "Basic usage",
          code: `$op: pipe
  do:
    - "Hello, World!"
    - $op: str.compress
`,
          result: "BIUwNmD2A0AEDqkBOYAmBCIA",
        }
      ]
    }
  }
  patchConfig = contextDefaultedFieldPatch("value")
  execute({ value, format }: z.TypeOf<this["schema"]>): string {
    switch (format) {
      case "encodedURIComponent":
        return compressToEncodedURIComponent(value);
      default:
        throw new Error(`Unsupported format: ${formatEnum}`);
    }
  }
}

const lengthConfig = z.object({
  value: z.string(),
})

export class LengthOpFactory extends TaskOpFactory<
  typeof lengthConfig,
  number
> {
  name = "length";
  schema = lengthConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  /** @default <context> */
  value?: string
}`,
          returns: `number`,
          description: "Returns the length of `value`",
        },
      ];
    }
  }
  patchConfig = contextDefaultedFieldPatch("value")
  execute({ value }: z.TypeOf<this["schema"]>): number {
    return value.length;
  }
}

export function stringsOperatorsFactories() {
  return [
    new LengthOpFactory(),
    new JoinOpFactory(),
    new ReplaceOpFactory(),
    new ReplaceByRegExpOpFactory(),
    new MatchOpFactory(),
    new SplitOpFactory(),
    new SplitByRegExpOpFactory(),
    new SearchOpFactory(),
    new CompressOpFactory(),
  ];
}
