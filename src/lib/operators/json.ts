import { z } from "zod";

import { TaskOpFactory } from "@/lib/operator";

const stringifyConfig = z.object({
  value: z.unknown(),
});

export class StringifyOpFactory extends TaskOpFactory<
  typeof stringifyConfig,
  string
> {
  schema = stringifyConfig;
  protected execute({ value }: z.TypeOf<this["schema"]>): string {
    return JSON.stringify(value);
  }
}

const parseConfig = z.object({
  value: z.string(),
});

export class ParseOpFactory extends TaskOpFactory<typeof parseConfig, unknown> {
  schema = parseConfig;
  protected execute({ value }: z.TypeOf<this["schema"]>): unknown {
    return JSON.parse(value);
  }
}

export function jsonOperatorsFactories() {
  return {
    stringify: new StringifyOpFactory(),
    parse: new ParseOpFactory(),
  };
}
