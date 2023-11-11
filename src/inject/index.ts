import { parse } from "yaml";

import { traverseJsonLike } from "@/lib/json-like-traverser";
import {
  evalInScope,
  makeComposedFactory,
  makeOperatorResolver,
} from "@/lib/operator";
import { stringifyError } from "@/lib/error";
import { IRemoteActor } from "@/lib/actor";

import { Action, ActionResults } from "@/shared/rpc";
import { createAndMountIFrame, createSandbox } from "@/shared/sandbox";

import { Evaluator, Renderer } from "./impl";
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
        })
      )
    ),
  };
  window.__SCRAPER_EXTENSION__ = INJECTED;
  return INJECTED;
}

export type Injected = ReturnType<typeof inject>;

createSandbox("sandbox.html", createAndMountIFrame).then(inject);
