import { z } from "zod";

import { TaskOpFactory } from "@/lib/operator";

const stringifyConfig = z.object({
  value: z.unknown(),
});

export class StringifyOpFactory extends TaskOpFactory<
  typeof stringifyConfig,
  string
> {
  name = "stringify";
  schema = stringifyConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
            value: <json>
          }`,
          returns: `string`,
          description: "Converts a `<json>` value to a JSON string.",
        },
      ];
    }
  }
  protected execute({ value }: z.TypeOf<this["schema"]>): string {
    return JSON.stringify(value);
  }
}

const parseConfig = z.object({
  value: z.string(),
});

export class ParseOpFactory extends TaskOpFactory<typeof parseConfig, unknown> {
  name = "parse";
  schema = parseConfig;
  constructor() {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
            value: string
          }`,
          returns: `<json>`,
          description: "Parses a JSON string.",
        },
      ];
    }
  }
  protected execute({ value }: z.TypeOf<this["schema"]>): unknown {
    return JSON.parse(value);
  }
}

export function jsonOperatorsFactories() {
  return [new StringifyOpFactory(), new ParseOpFactory()];
}
