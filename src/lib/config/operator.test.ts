import { it, expect, beforeEach } from "vitest";

import {
  OPERATOR_KEY,
  ScopedOp,
  evalInScope,
  makeComposedFactory,
  makeOperatorResolver,
} from "@/lib/operator";
import { traverseJsonLike } from "@/lib/json-like-traverser";
import { AsyncFactory } from "@/lib/factory";
import { TemplateRendererData } from "@/lib/operators/template";
import { AsyncValidatorData, ShowFormData } from "@/lib/operators/json-schema";
import { ILogger } from "@/lib/logger";

import { compileOperatorFactories } from "./operator";

let resolver: <C>(context: C) => ScopedOp<unknown> | C;

beforeEach(() => {
  resolver = makeOperatorResolver(
    makeComposedFactory(
      compileOperatorFactories({
        window: {} as Window,
        evaluator: {} as AsyncFactory<string, unknown>,
        rendered: {} as AsyncFactory<TemplateRendererData, string>,
        validator: {} as AsyncFactory<AsyncValidatorData, boolean>,
        formShower: {} as AsyncFactory<ShowFormData, unknown>,
        logger: {} as unknown as ILogger,
      })
    )
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
            [OPERATOR_KEY]: "ctx.get",
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

it("Should support recursion", async () => {
  const result = traverseJsonLike(resolver, {
    [OPERATOR_KEY]: "sys.define",
    functions: {
      fib: {
        [OPERATOR_KEY]: "if",
        condition: {
          [OPERATOR_KEY]: "lte",
          left: {
            [OPERATOR_KEY]: "ctx.get",
          },
          right: 1,
        },
        then: {
          [OPERATOR_KEY]: "ctx.get",
        },
        else: {
          [OPERATOR_KEY]: "plus",
          left: {
            [OPERATOR_KEY]: "sys.call",
            fn: "fib",
            arg: {
              [OPERATOR_KEY]: "minus",
              left: {
                [OPERATOR_KEY]: "ctx.get",
              },
              right: 1,
            },
          },
          right: {
            [OPERATOR_KEY]: "sys.call",
            fn: "fib",
            arg: {
              [OPERATOR_KEY]: "minus",
              left: {
                [OPERATOR_KEY]: "ctx.get",
              },
              right: 2,
            },
          },
        },
      },
    },
    for: {
      [OPERATOR_KEY]: "sys.call",
      fn: "fib",
    },
  });

  expect(
    await evalInScope(result, {
      constants: {},
      functions: {},
      context: 9,
    })
  ).toBe(34);
});
