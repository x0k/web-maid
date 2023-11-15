import { optionFlow } from "../function";
import { isNull } from "../guards";
import { toTitle } from "./converters";
import { tryForEach } from "./core";
import {
  jsonldJsonQuery,
  queryAttr,
  queryTextContent,
  stringify,
} from "./extractors";

export const title = tryForEach(optionFlow(isNull, stringify, toTitle))(
  queryAttr('meta[property="og:title" i]', "content"),
  queryAttr('meta[name="twitter:title" i]', "content"),
  queryAttr('meta[property="twitter:title"]', "content"),
  queryAttr('meta[name="title" i]', "content"),
  queryTextContent("title"),
  jsonldJsonQuery("$..headline"),
  queryTextContent(".post-title"),
  queryTextContent(".entry-title"),
  queryTextContent("h1[class*='title'] a"),
  queryTextContent("h1[class*='title']")
);
