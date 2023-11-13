import { z } from "zod";
import mime from "mime/lite";

import { TaskOpFactory } from "@/lib/operator";

export const requestConfig = z.object({
  url: z.string(),
  method: z
    .enum(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
    .optional(),
  headers: z.record(z.string()).optional(),
  body: z.string().optional(),
  as: z.enum(["json", "text"]).optional(),
});

export class RequestOpFactory extends TaskOpFactory<
  typeof requestConfig,
  unknown
> {
  schema = requestConfig;
  async execute({
    url,
    method,
    headers,
    body,
    as,
  }: z.TypeOf<this["schema"]>): Promise<unknown> {
    const response = await fetch(url, {
      method,
      headers,
      body,
    });
    if (as) {
      return response[as]();
    }
    const contentType = response.headers.get("Content-Type");
    if (!contentType) {
      return response.text();
    }
    const ext = mime.getExtension(contentType);
    switch (ext) {
      case "json":
        return response.json();
      default:
        return response.text();
    }
  }
}

export function httpOperatorsFactories() {
  return {
    request: new RequestOpFactory(),
  };
}
