import { z } from "zod";
import { ScopedOpFactory, TaskOpFactory } from "@/lib/operator";

const notConfig = z.object({
  value: z.any(),
});

export class NotOpFactory extends TaskOpFactory<typeof notConfig, boolean> {
  readonly schema = notConfig;
  execute({ value }: z.TypeOf<this["schema"]>): boolean {
    return !value;
  }
}

const joinConfig = z.object({
  values: z.array(z.string()),
  separator: z.string().default(", "),
});

export class JoinOpFactory extends TaskOpFactory<typeof joinConfig, string> {
  readonly schema = joinConfig;
  execute({ values, separator }: z.TypeOf<this["schema"]>): string {
    return values.join(separator);
  }
}

export function stdOperatorsFactories(): Record<
  string,
  ScopedOpFactory<unknown>
> {
  return {
    not: new NotOpFactory(),
    join: new JoinOpFactory(),
  };
}
