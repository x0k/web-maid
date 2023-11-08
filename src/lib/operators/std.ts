import { z } from "zod";
import { TaskOpFactory, type OpFactory, type OpOrVal } from "@/lib/operator";

const notConfig = z.object({
  value: z.any(),
});

export class NotOpFactory extends TaskOpFactory<typeof notConfig> {
  readonly schema = notConfig;
  exec({ value }: z.TypeOf<this["schema"]>): OpOrVal {
    return !value;
  }
}

const joinConfig = z.object({
  values: z.array(z.string()),
  separator: z.string().default(", "),
});

export class JoinOpFactory extends TaskOpFactory<typeof joinConfig> {
  readonly schema = joinConfig;
  exec({ values, separator }: z.TypeOf<this["schema"]>): OpOrVal {
    return values.join(separator);
  }
}

export function stdOperatorsFactories(): Record<string, OpFactory> {
  return {
    not: new NotOpFactory(),
    join: new JoinOpFactory(),
  };
}
