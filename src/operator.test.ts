import { it, expect } from "vitest";
import { makeAppOperatorResolver } from "./operator";
import { OPERATOR_KEY } from "./lib/operator";
import { traverseJsonLike } from "./lib/json-like-traverser";

it("Should evaluate simple operators", () => {
  const resolver = makeAppOperatorResolver();
  const result = resolver({
    [OPERATOR_KEY]: "not",
    value: false,
  });
  if (typeof result === "function") {
    expect(result(null)).toBe(true);
  } else {
    expect.fail(`Expected function, got ${typeof result}`);
  }
});

it.only("Should evaluate nested operators", () => {
  const resolver = makeAppOperatorResolver();
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
        const: 'complex',
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
  if (typeof result === "function") {
    expect(result(null)).toEqual({
      inner: true,
    });
  } else {
    expect.fail(`Expected function, got ${typeof result}`);
  }
});
