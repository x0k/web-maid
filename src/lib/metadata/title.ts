import { tryForEach } from "./core";
import { toTitle } from "./converters";
import { jsonldJsonQuery, queryAttr, queryTextContent } from "./extractors";

export const title = tryForEach(toTitle)(
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
