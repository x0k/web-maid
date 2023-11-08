import { composedFactory, makeOperatorResolver } from "@/lib/operator";
import { browserOperatorsFactories } from "@/lib/operators/browser";
import { flowOperatorsFactories } from "@/lib/operators/flow";
import {
  RuntimeSystem,
  runtimeOperatorsFactories,
} from "@/lib/operators/runtime";
import { stdOperatorsFactories } from "@/lib/operators/std";

export function makeAppOperatorResolver() {
  const runtime = new RuntimeSystem({
    constants: {},
    functions: {},
  });
  return makeOperatorResolver(
    composedFactory(
      Object.assign(
        {},
        flowOperatorsFactories(),
        stdOperatorsFactories(),
        runtimeOperatorsFactories(runtime),
        browserOperatorsFactories(window, document)
      )
    )
  );
}
