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
import { FetcherData } from "@/lib/operators/http";
import { EvaluatorData } from "@/lib/operators/document";
import { DownloaderData } from '@/lib/operators/fs';

import { compileOperatorFactories } from "./operator";

export interface OperatorResolveOptions {
  debug: boolean;
  evaluator: AsyncFactory<EvaluatorData, unknown>;
  rendered: AsyncFactory<TemplateRendererData, string>;
  validator: AsyncFactory<AsyncValidatorData, boolean>;
  formShower: AsyncFactory<ShowFormData, unknown>;
  fetcher: AsyncFactory<FetcherData, unknown>;
  okShower: AsyncFactory<string, void>;
  logger: ILogger;
  downloader: AsyncFactory<DownloaderData, void>;
}

export function createOperatorResolver({
  debug,
  evaluator,
  formShower,
  okShower,
  fetcher,
  logger,
  rendered,
  validator,
  downloader,
}: OperatorResolveOptions) {
  const operatorsFactory = makeComposedFactory(
    compileOperatorFactories({
      window,
      evaluator,
      rendered,
      validator,
      formShower,
      okShower,
      fetcher,
      logger,
      downloader,
      operatorsFactory: {
        Create(config): ScopedOp<unknown> {
          return operatorsFactory(config);
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
