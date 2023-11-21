import { it, expect } from "vitest";

import { JsonLike, traverseJsonLike } from "./json-like-traverser";
import {
  REF_KEY,
  ResolvableFile,
  makeFilesResolver,
  makePathResolverFactory,
} from "./files-resolver";

it("Should embed content of referenced file", () => {
  const files = [
    {
      name: "0",
      content: {
        a: {
          [REF_KEY]: "./a",
        },
      },
    },
    {
      name: "a",
      content: {
        b: {
          [REF_KEY]: "./b",
        },
      },
    },
    {
      name: "b",
      content: {
        c: "c",
      },
    },
  ];
  const pathResolverFactory = makePathResolverFactory<unknown, unknown>(files);
  const resolver = (
    content: JsonLike<unknown>,
    file: ResolvableFile<unknown>
  ): unknown =>
    traverseJsonLike(
      makeFilesResolver(pathResolverFactory(resolver, file)),
      content
    );
  const file = files[0];
  const result = resolver(file.content, file);
  expect(result).toEqual({
    a: {
      b: {
        c: "c",
      },
    },
  });
});

it("Should work with internal references", () => {
  const pathResolverFactory = makePathResolverFactory([]);
  const resolverWithFull = (
    content: JsonLike<unknown>,
    file: ResolvableFile<unknown>
  ): unknown =>
    traverseJsonLike(
      makeFilesResolver(pathResolverFactory(resolverWithFull, file)),
      content
    );
  const resolver = (file: ResolvableFile<unknown>) =>
    resolverWithFull(file.content, file);
  const result = resolver({
    name: "a",
    content: {
      a: {
        [REF_KEY]: "#b",
      },
      b: {
        [REF_KEY]: "#c[0]",
      },
      c: [1],
    },
  });
  expect(result).toEqual({
    a: 1,
    b: 1,
    c: [1],
  });
});

it("Should work with complex references", () => {
  const files = [
    {
      name: "a",
      content: {
        [REF_KEY]: "./b#key",
        key: {
          [REF_KEY]: "./c#$[0]",
        },
        key2: "data",
      },
    },
    {
      name: "b",
      content: {
        key: {
          [REF_KEY]: "./a#key",
        },
      },
    },
    {
      name: "c",
      content: [
        {
          [REF_KEY]: "./a#key2",
        },
      ],
    },
  ];
  const pathResolverFactory = makePathResolverFactory<unknown, unknown>(files);
  const resolver = (
    content: JsonLike<unknown>,
    file: ResolvableFile<unknown>
  ): unknown =>
    traverseJsonLike(
      makeFilesResolver(pathResolverFactory(resolver, file)),
      content
    );
  const file = files[0];
  const result = resolver(file.content, file);
  expect(result).toEqual("data");
});

it("Should check for circular references", () => {
  const files = [
    {
      name: "a",
      content: {
        [REF_KEY]: "./b",
      },
    },
    {
      name: "b",
      content: {
        [REF_KEY]: "./c",
      },
    },
    {
      name: "c",
      content: {
        [REF_KEY]: "./a",
      },
    },
  ];
  const pathResolverFactory = makePathResolverFactory<unknown, unknown>(files);
  const resolverWithFull = (
    content: JsonLike<unknown>,
    file: ResolvableFile<unknown>
  ): unknown =>
    traverseJsonLike(
      makeFilesResolver(pathResolverFactory(resolverWithFull, file)),
      content
    );
  const file = files[0];
  expect(() => resolverWithFull(file.content, file)).toThrow(
    "Cyclic reference"
  );
});
