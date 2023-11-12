import { AsyncFactory } from "@/lib/factory";
import { assignWithPrefix } from "@/lib/object";
import { ScopedOpFactory } from "@/lib/operator";
import { contextOperatorsFactories } from "@/lib/operators/context";
import { documentOperatorsFactories } from "@/lib/operators/document";
import { flowOperatorsFactories } from "@/lib/operators/flow";
import { fsOperatorsFactories } from "@/lib/operators/fs";
import { htmlOperatorsFactories } from "@/lib/operators/html";
import { jsonOperatorsFactories } from "@/lib/operators/json";
import {
  AsyncValidatorData,
  jsonSchemaOperatorsFactories,
} from "@/lib/operators/json-schema";
import { stringsOperatorsFactories } from "@/lib/operators/strings";
import { sysOperatorsFactories } from "@/lib/operators/sys";
import {
  templateOperatorsFactories,
  TemplateRendererData,
} from "@/lib/operators/template";

export interface OperatorFactoryConfig {
  window: Window;
  evaluator: AsyncFactory<string, unknown>;
  rendered: AsyncFactory<TemplateRendererData, string>;
  validator: AsyncFactory<AsyncValidatorData, boolean>;
}

export function compileOperatorFactories({
  window,
  evaluator,
  rendered,
  validator,
}: OperatorFactoryConfig) {
  const factories: Record<
    string,
    ScopedOpFactory<unknown>
  > = flowOperatorsFactories();
  assignWithPrefix("sys.", factories, sysOperatorsFactories());
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
  assignWithPrefix("ctx.", factories, contextOperatorsFactories());
  assignWithPrefix("html.", factories, htmlOperatorsFactories(window));
  assignWithPrefix("str.", factories, stringsOperatorsFactories());
  assignWithPrefix("fs.", factories, fsOperatorsFactories());
  assignWithPrefix("json.", factories, jsonOperatorsFactories());
  assignWithPrefix(
    "jsonSchema.",
    factories,
    jsonSchemaOperatorsFactories(validator)
  );
  return factories;
}
