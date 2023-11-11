import { z } from "zod";

const requestSchema = z.object({
  active: z.boolean().default(true),
  method: z
    .enum(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
    .default("POST"),
  url: z.string().url(),
  headers: z.record(z.string()).optional(),
  queryParameters: z.record(z.string()).optional(),
  body: z.object({
    schema: z.record(z.any()).optional(),
    uiSchema: z.record(z.any()).optional(),
    content: z.any().optional(),
  }),
});

export const configSchema = z.array(requestSchema);
