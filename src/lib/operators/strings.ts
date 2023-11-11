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

export function stringsOperatorsFactories() {
  return {
    join: new JoinOpFactory(),
  };
}
