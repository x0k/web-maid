import { parse } from "yaml";

import { JsonLike, traverseJsonLike } from "@/lib/json-like-traverser";
import { evalInScope } from "@/lib/operator";
import {
  ResolvableFile,
  makeFilesResolver,
  makePathResolverFactory,
} from "@/lib/files-resolver";
import { flow } from "@/lib/function/flow";

export interface EvalConfigFile {
  name: string;
  content: string;
}

export interface EvalConfigOptions {
  configFiles: EvalConfigFile[];
  secrets: string;
  operatorResolver: (value: unknown) => unknown;
}

export function evalConfig({
  configFiles,
  secrets,
  operatorResolver,
}: EvalConfigOptions) {
  const files = [];
  let main: ResolvableFile<unknown> | undefined;
  for (const file of configFiles) {
    files.push({
      name: file.name,
      content: parse(file.content),
    });
    if (file.name === "main") {
      main = files[files.length - 1];
    }
  }
  if (main === undefined) {
    throw new Error("main config file not found");
  }
  const pathResolverFactory = makePathResolverFactory<unknown, unknown>(files);
  const resolve = (content: JsonLike<unknown>, file: ResolvableFile<unknown>) =>
    traverseJsonLike(
      flow(
        makeFilesResolver(pathResolverFactory(resolve, file)),
        operatorResolver
      ),
      content
    );
  return evalInScope(resolve(main.content, main), {
    functions: {},
    constants: {},
    context: parse(secrets),
    error: null,
  });
}
