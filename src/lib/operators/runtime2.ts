import { TypeOf, ZodType, z } from "zod";
import {
  OpExecutor,
  OpFactory,
  OpFactoryConfig,
  withValidation,
} from "@/lib/operator";

const opConfig = z.function().args(z.any()).returns(z.any());

const defineConfig = z.object({
  constants: z.record(z.any()).optional(),
  functions: z.record(opConfig).optional(),
  for: z.any(),
});

const defineFactory = withValidation(
  defineConfig,
  <R>({
    for: scope,
    constants,
    functions,
  }: TypeOf<typeof defineConfig>): OpExecutor<R> => {
    return (context) => {
      
    };
  }
);
