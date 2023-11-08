import { z } from 'zod';
import { jsonSchema } from '@/lib/zod';

export const configSchema = z.object({
  endpoint: z.string().url(),
  schema: z.record(z.any()).optional(),
  uiSchema: z.record(z.any()).optional(),
  context: jsonSchema.default(null),
  data: jsonSchema,
})
