import { makeComposedFactory, makeOperatorResolver } from "@/lib/operator";
import { browserOperatorsFactories } from "@/lib/operators/browser";
import { flowOperatorsFactories } from "@/lib/operators/flow";
import { stdOperatorsFactories } from "@/lib/operators/std";
import { sysOperatorsFactories } from "@/lib/operators/sys";
import {
  TemplateRendererData,
  extOperatorsFactories,
} from "@/lib/operators/ext";
import { AsyncFactory } from "@/lib/factory";

export function makeAppOperatorResolver(
  window: Window,
  evaluator: AsyncFactory<string, unknown>,
  rendered: AsyncFactory<TemplateRendererData, string>
) {
  const factories = {
    ...sysOperatorsFactories(),
    ...stdOperatorsFactories(),
    ...flowOperatorsFactories(),
    ...stdOperatorsFactories(),
    ...browserOperatorsFactories(window, evaluator),
    ...extOperatorsFactories(rendered),
  };
  const composedFactory = makeComposedFactory(factories);
  return makeOperatorResolver(composedFactory);
}
