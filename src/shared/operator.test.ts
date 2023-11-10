import { it, expect, beforeEach } from "vitest";

import { OPERATOR_KEY, ScopedOp, evalInScope } from "@/lib/operator";
import { traverseJsonLike } from "@/lib/json-like-traverser";
import { AsyncFactory } from "@/lib/factory";
import { TemplateRendererData } from "@/lib/operators/ext";

import { makeAppOperatorResolver } from "./operator";

let resolver: <C>(context: C) => ScopedOp<unknown> | C;

beforeEach(() => {
  resolver = makeAppOperatorResolver(
    {} as Window,
    {} as AsyncFactory<string, unknown>,
    {} as AsyncFactory<TemplateRendererData, string>
  );
});

it("Should evaluate simple operators", async () => {
  const result = resolver({
    [OPERATOR_KEY]: "not",
    value: false,
  });
  expect(
    await evalInScope(result, {
      constants: {},
      functions: {},
      context: null,
    })
  ).toBe(true);
});

it("Should evaluate nested operators", async () => {
  const result = traverseJsonLike(resolver, {
    [OPERATOR_KEY]: "sys.define",
    constants: {
      complex: {
        inner: {
          [OPERATOR_KEY]: "not",
          value: {
            [OPERATOR_KEY]: "ctx",
          },
        },
      },
    },
    functions: {
      sysGet: {
        [OPERATOR_KEY]: "sys.get",
        const: "complex",
      },
    },
    for: {
      [OPERATOR_KEY]: "and",
      conditions: [
        [],
        "value",
        {
          [OPERATOR_KEY]: "sys.call",
          fn: "sysGet",
        },
      ],
    },
  });
  expect(
    await evalInScope(result, {
      constants: {},
      functions: {},
      context: null,
    })
  ).toEqual({
    inner: true,
  });
});
