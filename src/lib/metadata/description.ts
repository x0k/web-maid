import { toTrimmed } from "./converters";
import { tryForEach } from "./core";
import { jsonldJsonQuery, queryAttr } from "./extractors";

export const description = tryForEach(toTrimmed)(
  queryAttr("meta[property='og:description' i]", "content"),
  queryAttr("meta[name='twitter:description' i]", "content"),
  queryAttr("meta[property='twitter:description' i]", "content"),
  queryAttr("meta[name='description' i]", "content"),
  queryAttr("meta[itemprop='description' i]", "content"),
  jsonldJsonQuery("$..articleBy", "$..description")
);
