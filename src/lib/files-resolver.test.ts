import { it, expect } from "vitest";

import { JsonLike, traverseJsonLike } from "./json-like-traverser";
import {
  REF_KEY,
  ResolvableFile,
  makeFilesResolver,
  makePathResolver,
} from "./files-resolver";

it("Should embed content of referenced file", () => {
  const resolver = (content: JsonLike<unknown>): unknown =>
    traverseJsonLike(
      makeFilesResolver(
        makePathResolver(
          [
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
          ],
          resolver,
          { name: "", content }
        )
      ),
      content
    );
  const result = resolver({
    a: {
      [REF_KEY]: "./a",
    },
  });
  expect(result).toEqual({
    a: {
      b: {
        c: "c",
      },
    },
  });
});

it("Should work with simple internal references", () => {
  const resolverWithFull = (
    content: JsonLike<unknown>,
    file: ResolvableFile<unknown>
  ): unknown =>
    traverseJsonLike(
      makeFilesResolver(makePathResolver([], resolverWithFull, file)),
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
