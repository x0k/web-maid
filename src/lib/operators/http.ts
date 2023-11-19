import { z } from "zod";

import { TaskOpFactory } from "@/lib/operator";
import { AsyncFactory } from "@/lib/factory";

export const requestConfig = z.object({
  url: z.string(),
  method: z
    .enum(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
    .optional(),
  headers: z.record(z.string()).optional(),
  body: z.string().optional(),
  as: z.enum(["json", "text"]).optional(),
});

export interface FetcherData {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  as?: "json" | "text";
}

export class RequestOpFactory extends TaskOpFactory<
  typeof requestConfig,
  unknown
> {
  name = "request";
  schema = requestConfig;

  constructor(private readonly fetcher: AsyncFactory<FetcherData, unknown>) {
    super();
    if (import.meta.env.DEV) {
      this.signatures = [
        {
          params: `interface Config {
  url: string
  method?: string
  headers?: Record<string, string>
  body?: string
  as?: "json" | "text"
}`,
          returns: `<json> | string`,
          description:
            "Makes a fetch request. \
If `as` parameter is not provided, the result type will be determined \
by the `Content-Type` header.",
        },
      ];
    }
  }

  execute(config: z.TypeOf<this["schema"]>): Promise<unknown> {
    return this.fetcher.Create(config);
  }
}

export function httpOperatorsFactories(
  fetcher: AsyncFactory<FetcherData, unknown>
) {
  return [new RequestOpFactory(fetcher)];
}
