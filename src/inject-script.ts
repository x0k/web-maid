import { parse } from "yaml";

import { traverseJsonLike } from "@/lib/json-like-traverser";
import { evalInScope } from "@/lib/operator";
import { stringifyError } from "@/lib/error";

import { configSchema } from "@/shared/config";
import { makeAppOperatorResolver } from "@/shared/operator";

const INJECTED = {
  parse,
  configSchema,
  makeAppOperatorResolver,
  traverseJsonLike,
  evalInScope,
  stringifyError,
};

export type Injected = typeof INJECTED;

window.__SCRAPER_EXTENSION__ = INJECTED;