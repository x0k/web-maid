import { z } from "zod";
import { TaskOpFactory } from "@/lib/operator";

const joinConfig = z.object({
  values: z.array(z.string()),
  separator: z.string().default(""),
});

export class JoinOpFactory extends TaskOpFactory<typeof joinConfig, string> {
  readonly schema = joinConfig;
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
  schema = replaceConfig;
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
  schema = replaceConfig;
  protected execute({
    value,
    pattern,
    replacement,
  }: z.TypeOf<this["schema"]>): string {
    return value.replace(new RegExp(pattern, "gu"), replacement);
  }
}

export function stringsOperatorsFactories() {
  return {
    join: new JoinOpFactory(),
    replace: new ReplaceOpFactory(),
    replaceByRegExp: new ReplaceByRegExpOpFactory(),
  };
}
