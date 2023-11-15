import { toTrimmed } from "./converters";
import { flow, tryForEach } from "./core";
import { jsonldJsonQuery, queryAttr, stringify } from "./extractors";

export const description = tryForEach(toTrimmed)(
  queryAttr("meta[property='og:description' i]", "content"),
  queryAttr("meta[name='twitter:description' i]", "content"),
  queryAttr("meta[property='twitter:description' i]", "content"),
  queryAttr("meta[name='description' i]", "content"),
  queryAttr("meta[itemprop='description' i]", "content"),
  flow(jsonldJsonQuery("$..articleBy", "$..description"), stringify)
);
