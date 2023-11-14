import { AsyncFactory } from "@/lib/factory";
import { ILogger } from "@/lib/logger";
import {
  ScopedOp,
  makeComposedFactory,
  makeDebugFactory,
  makeOperatorResolver,
} from "@/lib/operator";
import { AsyncValidatorData, ShowFormData } from "@/lib/operators/json-schema";
import { TemplateRendererData } from "@/lib/operators/template";

import { compileOperatorFactories } from "./operator";

export interface OperatorResolveOptions {
  debug: boolean;
  evaluator: AsyncFactory<string, unknown>;
  rendered: AsyncFactory<TemplateRendererData, string>;
  validator: AsyncFactory<AsyncValidatorData, boolean>;
  formShower: AsyncFactory<ShowFormData, unknown>;
  logger: ILogger;
}

export function createOperatorResolver({
  debug,
  evaluator,
  formShower,
  logger,
  rendered,
  validator,
}: OperatorResolveOptions) {
  const operatorsFactory = makeComposedFactory(
    compileOperatorFactories({
      window,
      evaluator,
      rendered,
      validator,
      formShower,
      logger,
      operatorsFactory: {
        Create(config): ScopedOp<unknown> {
          return operatorsFactory.Create(config);
        },
      },
      operatorResolver: {
        Create(config): unknown {
          return operatorResolver(config);
        },
      },
    })
  );
  const operatorResolver = makeOperatorResolver(
    debug ? makeDebugFactory(operatorsFactory, logger) : operatorsFactory
  );
  return operatorResolver;
}
