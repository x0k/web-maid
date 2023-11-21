import jp from "jsonpath";

import { FactoryFn } from "./factory";
import { JsonLike } from "./json-like-traverser";

export const REF_KEY = "$ref";

export interface ResolvableFile<T> {
  name: string;
  content: JsonLike<T>;
}

export function makePathResolver<T, R>(
  files: ResolvableFile<T>[],
  fileHandler: (content: JsonLike<T>, file: ResolvableFile<T>) => R,
  currentFile: ResolvableFile<T>
) {
  const filesMap = new Map(files.map((file) => [file.name, file]));
  const resultsCache = new Map<string, R>();
  const selectorsCache = new Map<string, JsonLike<T>>();
  return (path: string) => {
    if (!(path.startsWith("./") || path.startsWith("#"))) {
      throw new Error("Invalid path");
    }
    if (resultsCache.has(path)) {
      return resultsCache.get(path);
    }
    const [filePath, selector] = path.split("#");
    let file = currentFile;
    if (filePath) {
      const simplePath = path.substring(2);
      const resolvedFile = filesMap.get(simplePath);
      if (resolvedFile === undefined) {
        throw new Error("File not found");
      }
      file = resolvedFile;
    }
    let selected = file.content;
    if (selector) {
      const cached = selectorsCache.get(`${file.name}#${selector}`);
      if (cached !== undefined) {
        selected = cached;
      } else {
        const selection = jp.value(file.content, selector);
        if (selection === undefined) {
          throw new Error("Selector result is undefined");
        }
        selectorsCache.set(`${file.name}#${selector}`, selection);
        selected = selection;
      }
    }
    const result = fileHandler(selected, file);
    resultsCache.set(path, result);
    return result;
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
