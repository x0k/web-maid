import { makeComposedFactory, makeOperatorResolver } from "@/lib/operator";
import { browserOperatorsFactories } from "@/lib/operators/browser";
import { flowOperatorsFactories } from "@/lib/operators/flow";
import { stdOperatorsFactories } from "@/lib/operators/std";
import { sysOperatorsFactories } from "@/lib/operators/sys";

export function makeAppOperatorResolver(window: Window, document: Document) {
  const factories = {
    ...sysOperatorsFactories(),
    ...stdOperatorsFactories(),
    ...flowOperatorsFactories(),
    ...stdOperatorsFactories(),
    ...browserOperatorsFactories(window, document),
  };
  const composedFactory = makeComposedFactory(factories);
  return makeOperatorResolver(composedFactory);
}
