import { it, expect, describe } from "vitest";

import { moveItemBeforeInPlace } from "./array";

function makeTest<T>(items: T[], moved: number, before: number, expected: T[]) {
  it(`should move item ${moved} before ${before}`, () => {
    const arr = items.slice();
    moveItemBeforeInPlace(arr, moved, before);
    expect(arr).toEqual(expected);
  });
}

describe("moveItemBeforeInPlace", () => {
  describe("should move item before", () => {
    const arr = [0, 1, 2, 3, 4, 5];
    makeTest(arr, 3, 1, [0, 3, 1, 2, 4, 5]);
    makeTest(arr, 5, 1, [0, 5, 1, 2, 3, 4]);
    makeTest(arr, 0, 5, [1, 2, 3, 4, 0, 5]);
    makeTest(arr, 0, 3, [1, 2, 0, 3, 4, 5]);
  });
  describe("should move item to the end", () => {
    const arr = [0, 1, 2, 3, 4, 5];
    makeTest(arr, 3, 6, [0, 1, 2, 4, 5, 3]);
    makeTest(arr, 0, 6, [1, 2, 3, 4, 5, 0]);
  });
  describe("should move item to the beginning", () => {
    const arr = [0, 1, 2, 3, 4, 5];
    makeTest(arr, 3, 0, [3, 0, 1, 2, 4, 5]);
    makeTest(arr, 5, 0, [5, 0, 1, 2, 3, 4]);
  });
  describe("should do nothing", () => {
    const arr = [0, 1, 2, 3, 4, 5];
    makeTest(arr, 3, 4, arr);
    makeTest(arr, 0, 0, arr);
    makeTest(arr, 0, 1, arr);
    makeTest(arr, 3, 3, arr);
    makeTest(arr, 5, 6, arr);
    makeTest(arr, 5, 5, arr);
  });
  describe("should do nothing 2", () => {
    const arr = [0, 1];
    makeTest(arr, 0, 1, arr);
  });
});
