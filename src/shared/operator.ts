import type Handlebars from "handlebars";

import { makeComposedFactory, makeOperatorResolver } from "@/lib/operator";
import { browserOperatorsFactories } from "@/lib/operators/browser";
import { flowOperatorsFactories } from "@/lib/operators/flow";
import { stdOperatorsFactories } from "@/lib/operators/std";
import { sysOperatorsFactories } from "@/lib/operators/sys";
import { extOperatorsFactories } from "@/lib/operators/ext";

export function makeAppOperatorResolver(
  window: Window,
  hbs: typeof Handlebars
) {
  const factories = {
    ...sysOperatorsFactories(),
    ...stdOperatorsFactories(),
    ...flowOperatorsFactories(),
    ...stdOperatorsFactories(),
    ...browserOperatorsFactories(window),
    ...extOperatorsFactories(hbs),
  };
  const composedFactory = makeComposedFactory(factories);
  return makeOperatorResolver(composedFactory);
}
