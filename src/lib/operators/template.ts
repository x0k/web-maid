import { z } from "zod";

import { FlowOpFactory, ScopedOp, evalInScope } from "@/lib/operator";
import { AsyncFactory } from "@/lib/factory";

const templateConfig = z.object({
  template: z.unknown(),
  data: z.unknown().optional(),
});

export interface TemplateRendererData {
  template: string;
  data: unknown;
}

export class TemplateFactory extends FlowOpFactory<
  typeof templateConfig,
  string
> {
  name = "render";
  schema = templateConfig;

  constructor(
    private readonly hbs: AsyncFactory<TemplateRendererData, string>
  ) {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface RenderConfig {
  template: string;
  data?: unknown;
}`,
          returns: "string",
          description: "Renders handlebars `template` with `data`.",
        },
      ];
      this.examples = [
        {
          description: "Basic usage",
          code: `$op: template.render
template: |
  Hello, {{name}}!
data:
  name: John`,
          result: "Hello, John!",
        },
      ];
    }
  }

  create({ template, data }: z.TypeOf<this["schema"]>): ScopedOp<string> {
    return async (scope) => {
      const resolvedTemplate = await evalInScope(template, scope);
      if (typeof resolvedTemplate !== "string") {
        throw new Error(`Template is not a string: ${resolvedTemplate}`);
      }
      const resolvedData = await evalInScope(data ?? scope.context, scope);
      return this.hbs.Create({
        template: resolvedTemplate,
        data: resolvedData,
      });
    };
  }
}

export function templateOperatorsFactories(
  hbs: AsyncFactory<TemplateRendererData, string>
) {
  return [new TemplateFactory(hbs)];
}
