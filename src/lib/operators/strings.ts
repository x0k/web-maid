import { z } from "zod";

import { TaskOpFactory } from "@/lib/operator";

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

export function stringsOperatorsFactories() {
  return [
    new JoinOpFactory(),
    new ReplaceOpFactory(),
    new ReplaceByRegExpOpFactory(),
  ];
}
