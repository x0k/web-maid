import jp from "jsonpath";

import { FactoryFn } from "./factory";
import { JsonLike } from "./json-like-traverser";

export const REF_KEY = "$ref";

export interface ResolvableFile<T> {
  name: string;
  content: JsonLike<T>;
}

export function makePathResolverFactory<T, R>(files: ResolvableFile<T>[]) {
  const filesMap = new Map(files.map((file) => [file.name, file]));
  const resultsCache = new Map<string, R>();
  const inRun = new Set<string>();
  return (
    fileHandler: (content: JsonLike<T>, file: ResolvableFile<T>) => R,
    currentFile: ResolvableFile<T>,
  ) => {
    return (path: string) => {
      if (!(path.startsWith("./") || path.startsWith("#"))) {
        throw new Error("Invalid path");
      }
      const [filePath = '', selector = ''] = path.split("#");
      let file = currentFile;
      if (filePath) {
        const simplePath = filePath.substring(2);
        const resolvedFile = filesMap.get(simplePath);
        if (resolvedFile === undefined) {
          throw new Error(`File not found: "${filePath}"`);
        }
        file = resolvedFile;
      }
      const normalizedPath = `${file.name}#${selector}`;
      if (resultsCache.has(normalizedPath)) {
        return resultsCache.get(normalizedPath)!;
      }
      if (inRun.has(normalizedPath)) {
        throw new Error(`Cyclic reference: ${normalizedPath}`);
      }
      inRun.add(normalizedPath);
      let selected = file.content;
      if (selector) {
        const selection = jp.value(file.content, selector);
        if (selection === undefined) {
          throw new Error(`Result of selector "${selector}" for file "${file.name}" is undefined`);
        }
        selected = selection;
      }
      const result = fileHandler(selected, file);
      resultsCache.set(normalizedPath, result);
      inRun.delete(normalizedPath);
      return result;
    };
  };
}

export function makeFilesResolver(factory: FactoryFn<string, unknown>) {
  return <C>(context: C) => {
    if (
      typeof context === "object" &&
      context !== null &&
      REF_KEY in context &&
      typeof context[REF_KEY] === "string"
    ) {
      return factory(context[REF_KEY]);
    }
    return context;
  };
}
