import { it, expect } from "vitest";

import { OPERATOR_KEY, evalInScope } from "@/lib/operator";
import { traverseJsonLike } from "@/lib/json-like-traverser";

import { makeAppOperatorResolver } from "./operator";

it("Should evaluate simple operators", async () => {
  const resolver = makeAppOperatorResolver(null as any, null as any);
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
  const resolver = makeAppOperatorResolver(null as any, null as any);
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
