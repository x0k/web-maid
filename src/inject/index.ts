import { parse } from "yaml";

import { traverseJsonLike } from "@/lib/json-like-traverser";
import {
  evalInScope,
  makeComposedFactory,
  makeOperatorResolver,
} from "@/lib/operator";
import { stringifyError } from "@/lib/error";
import { IRemoteActor } from "@/lib/actor";

import { Action, ActionResults } from "@/shared/sandbox/action";
import {
  createAndMountIFrame,
  connectToSandbox,
} from "@/shared/sandbox/connect";

import { Evaluator, Renderer, Validator } from "./impl";
import { compileOperatorFactories } from "./operator";

function inject(sandbox: IRemoteActor<Action, ActionResults>) {
  const INJECTED = {
    parse,
    traverseJsonLike,
    evalInScope,
    stringifyError,
    resolver: makeOperatorResolver(
      makeComposedFactory(
        compileOperatorFactories({
          window,
          evaluator: new Evaluator(sandbox),
          rendered: new Renderer(sandbox),
          validator: new Validator(sandbox),
          // TODO: Implement form shower
          formShower: new Validator(sandbox),
        })
      )
    ),
  };
  window.__SCRAPER_EXTENSION__ = INJECTED;
  return INJECTED;
}

export type Injected = ReturnType<typeof inject>;

connectToSandbox("sandbox.html", createAndMountIFrame).then(inject);
