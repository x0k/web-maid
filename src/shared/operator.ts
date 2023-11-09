import { makeComposedFactory, makeOperatorResolver } from "@/lib/operator";
import { browserOperatorsFactories } from "@/lib/operators/browser";
import { flowOperatorsFactories } from "@/lib/operators/flow";
import { stdOperatorsFactories } from "@/lib/operators/std";

export function makeAppOperatorResolver() {
  const factories = {
    ...stdOperatorsFactories(),
    ...flowOperatorsFactories(),
    ...stdOperatorsFactories(),
    ...browserOperatorsFactories(window, document),
  };
  const composedFactory = makeComposedFactory(factories);
  return makeOperatorResolver(composedFactory);
}
