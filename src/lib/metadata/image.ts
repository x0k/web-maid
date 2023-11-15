import { tryForEach } from "./core";
import { jsonldJsonQuery, queryAttr } from "./extractors";
import { isImageUrl } from "./guards";

export const image = tryForEach(isImageUrl)(
  queryAttr('meta[property="og:image:secure_url" i]', "content"),
  queryAttr('meta[property="og:image:url" i]', "content"),
  queryAttr('meta[property="og:image" i]', "content"),
  queryAttr('meta[name="twitter:image:src" i]', "content"),
  queryAttr('meta[property="twitter:image:src" i]', "content"),
  queryAttr('meta[name="twitter:image" i]', "content"),
  queryAttr('meta[property="twitter:image" i]', "content"),
  queryAttr('meta[itemprop="image" i]', "content"),
  jsonldJsonQuery("$..image.url", "$..image"),
  queryAttr("article img[src], #content img[src]", "src"),
  queryAttr("img[alt*='cover'], img[alt*='author']", "src"),
  queryAttr("img[src]:not([aria-hidden='true'])", "src"),
  queryAttr("img[src]", "src")
);
