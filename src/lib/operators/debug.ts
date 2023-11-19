import { z } from "zod";

import { FlowOpFactory, ScopedOp, evalInScope } from "@/lib/operator";
import { ILogger } from "@/lib/logger";

const logConfig = z.object({
  label: z.unknown().optional(),
  value: z.unknown().optional(),
});

export class LogOpFactory extends FlowOpFactory<typeof logConfig, unknown> {
  name = "log";

  schema = logConfig;

  constructor(private readonly logger: ILogger) {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          description: `Prints a log message to the console`,
          params: `interface LogConfig {
  label?: string
  value?: any
}`,
          returns: `<context>`,
        },
      ];
      this.examples = [
        {
          description: "Prints a current context",
          code: "$op: dbg.log",
          result: `<context>`,
        },
        {
          description: "Prints specified value with provided label",
          code: `$op: dbg.log
label: "token"
value:
  $op: get
  key: token`,
          result: `<context>`,
        },
      ];
    }
  }

  protected create({
    value,
    label,
  }: z.TypeOf<this["schema"]>): ScopedOp<unknown> {
    return async (scope) => {
      this.logger.log({
        [String(label ? await evalInScope(label, scope) : "log")]:
          await evalInScope(value ?? scope.context, scope),
      });
      return scope.context;
    };
  }
}

export function debugOperatorsFactories(logger: ILogger) {
  return [new LogOpFactory(logger)];
}
