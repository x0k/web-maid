import { AsyncFactory, Factory } from "@/lib/factory";
import { ILogger } from "@/lib/logger";
import { assignWithPrefix } from "@/lib/object";
import { ScopedOpFactory } from "@/lib/operator";
import { debugOperatorsFactories } from "@/lib/operators/debug";
import { documentOperatorsFactories } from "@/lib/operators/document";
import { flowOperatorsFactories } from "@/lib/operators/flow";
import { fsOperatorsFactories } from "@/lib/operators/fs";
import { htmlOperatorsFactories } from "@/lib/operators/html";
import { FetcherData, httpOperatorsFactories } from "@/lib/operators/http";
import { jsonOperatorsFactories } from "@/lib/operators/json";
import {
  AsyncValidatorData,
  ShowFormData,
  jsonSchemaOperatorsFactories,
} from "@/lib/operators/json-schema";
import { stringsOperatorsFactories } from "@/lib/operators/strings";
import { sysOperatorsFactories } from "@/lib/operators/sys";
import {
  templateOperatorsFactories,
  TemplateRendererData,
} from "@/lib/operators/template";
import { mathOperatorsFactories } from "@/lib/operators/math";

export interface OperatorFactoryConfig {
  window: Window;
  evaluator: AsyncFactory<string, unknown>;
  rendered: AsyncFactory<TemplateRendererData, string>;
  validator: AsyncFactory<AsyncValidatorData, boolean>;
  formShower: AsyncFactory<ShowFormData, unknown>;
  fetcher: AsyncFactory<FetcherData, unknown>;
  logger: ILogger;
  operatorsFactory: ScopedOpFactory<unknown>;
  operatorResolver: Factory<unknown, unknown>;
}

export function compileOperatorFactories({
  window,
  evaluator,
  rendered,
  validator,
  formShower,
  fetcher,
  logger,
  operatorsFactory,
  operatorResolver,
}: OperatorFactoryConfig) {
  const factories: Record<
    string,
    ScopedOpFactory<unknown>
  > = flowOperatorsFactories();
  Object.assign(factories, mathOperatorsFactories());
  assignWithPrefix(
    "sys.",
    factories,
    sysOperatorsFactories(operatorsFactory, operatorResolver)
  );
  assignWithPrefix(
    "template.",
    factories,
    templateOperatorsFactories(rendered)
  );
  assignWithPrefix(
    "doc.",
    factories,
    documentOperatorsFactories(window, evaluator)
  );
  assignWithPrefix("html.", factories, htmlOperatorsFactories(window));
  assignWithPrefix("str.", factories, stringsOperatorsFactories());
  assignWithPrefix("fs.", factories, fsOperatorsFactories());
  assignWithPrefix("json.", factories, jsonOperatorsFactories());
  assignWithPrefix(
    "jsonSchema.",
    factories,
    jsonSchemaOperatorsFactories(validator, formShower)
  );
  assignWithPrefix("dbg.", factories, debugOperatorsFactories(logger));
  assignWithPrefix("http.", factories, httpOperatorsFactories(fetcher));
  return factories;
}
