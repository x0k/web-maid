import type Handlebars from "handlebars";
import { z } from "zod";

import { FlowOpFactory, ScopedOp, evalInScope } from "@/lib/operator";

const templateConfig = z.object({
  template: z.unknown(),
  data: z.unknown().optional(),
});

export class TemplateFactory extends FlowOpFactory<
  typeof templateConfig,
  string
> {
  readonly schema = templateConfig;

  constructor(private readonly hbs: typeof Handlebars) {
    super();
  }

  create({ template, data }: z.TypeOf<this["schema"]>): ScopedOp<string> {
    if (typeof template !== "string") {
      return async (scope) => {
        const resolvedTemplate = await evalInScope(template, scope);
        if (typeof resolvedTemplate !== "string") {
          throw new Error(`Template is not a string: ${resolvedTemplate}`);
        }
        const resolvedData = await evalInScope(data ?? scope.context, scope);
        return this.hbs.compile(resolvedTemplate)(resolvedData);
      };
    }
    const compiled = this.hbs.compile(template);
    return async (scope) => {
      const resolvedData = await evalInScope(data ?? scope.context, scope);
      return compiled(resolvedData);
    };
  }
}

export function extOperatorsFactories(hbs: typeof Handlebars) {
  return {
    template: new TemplateFactory(hbs),
  };
}
