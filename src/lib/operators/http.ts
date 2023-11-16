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
  schema = requestConfig;

  constructor(private readonly fetcher: AsyncFactory<FetcherData, unknown>) {
    super();
  }

  execute(config: z.TypeOf<this["schema"]>): Promise<unknown> {
    return this.fetcher.Create(config);
  }
}

export function httpOperatorsFactories(
  fetcher: AsyncFactory<FetcherData, unknown>
) {
  return {
    request: new RequestOpFactory(fetcher),
  };
}
