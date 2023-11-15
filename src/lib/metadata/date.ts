import { fallbacksWIthDefault } from "@/lib/function";

import { toDate, toString } from "./converters";
import { flow, tryForEach } from "./core";
import { jsonldJsonQuery, queryAttr, queryTextContent } from "./extractors";

const asDate = tryForEach(flow(toDate, toString));

export const unknownDate = asDate(
  queryAttr("meta[name='date' i]", "content"),
  queryAttr("meta[itemprop*='date' i]", "content"),
  queryAttr("time[itemprop*='date' i]", "datetime"),
  queryAttr("time[datetime]", "datetime"),
  queryTextContent("[class*='byline' i]"),
  queryTextContent("[id*='date' i]"),
  queryTextContent("[class*='date' i]"),
  queryTextContent("[class*='timestamp' i]"),
  queryTextContent("[class*='time' i]")
);

export const publishedDate = asDate(
  jsonldJsonQuery("$..datePublished", "$..dateCreated"),
  queryAttr("meta[property*='published_time' i]", "content"),
  queryAttr("meta[itmeprop*='datePublished' i]", "content"),
  queryAttr("time[itemprop*='datePublished' i]", "datetime")
);

export const modifiedDate = asDate(
  jsonldJsonQuery("$..dateModified"),
  queryAttr("meta[property*='modified_time' i]", "content"),
  queryAttr("meta[itmeprop*='dateModified' i]", "content"),
  queryAttr("time[itemprop*='dateModified' i]", "datetime")
);

export const date = fallbacksWIthDefault(
  null,
  modifiedDate,
  publishedDate,
  unknownDate
);
