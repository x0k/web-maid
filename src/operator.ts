import { composedFactory, makeOperatorResolver } from "./lib/operator";
import { flowOperatorsFactories } from "./lib/operators/flow-operators";
import {
  RuntimeSystem,
  runtimeOperatorsFactories,
} from "./lib/operators/runtime-operators";
import { stdOperatorsFactories } from "./lib/operators/std-operators";

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
        runtimeOperatorsFactories(runtime)
      )
    )
  );
}
