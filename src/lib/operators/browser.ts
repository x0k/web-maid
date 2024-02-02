import { z } from "zod";
import { BrowserFactory } from "./shared/browser-factory";

const openSchema = z.object({
  url: z.string().optional(),
  target: z.string().optional(),
  windowFeatures: z.record(z.unknown()).optional(),
});

export class OpenOpFactory extends BrowserFactory<typeof openSchema, boolean> {
  name = "open";
  readonly schema = openSchema;
  constructor(window: Window) {
    super(window);
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  url?: string;
  target?: string;
  windowFeatures?: Record<string, unknown>;
}`,
          returns: "boolean",
          description: "Loads a specified resource into a new or existing browsing context.",
        },
      ];
      this.examples = [
        {
          description: "Opens blank tab",
          code: "$op: browser.open",
          result: `<boolean>`,
        }
      ]
    }
  }
  protected execute({
    url,
    target,
    windowFeatures,
  }: z.TypeOf<this["schema"]>): boolean {
    return (
      this.window.open(
        url,
        target,
        windowFeatures &&
          Object.entries(windowFeatures)
            .map(([k, v]) => (v === true ? k : `${k}=${v}`))
            .join(",")
      ) !== null
    );
  }
}

export function browserOperatorsFactories(
  window: Window
) {
  return [new OpenOpFactory(window)];
}