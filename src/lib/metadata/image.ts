import {
  IMAGE_OR_VIDEO_REGEX,
  fallbacksWithIdentity,
  flow,
  tryForEach,
} from "./core";
import { toMimeType } from "./converters";
import { jsonldJsonQuery, queryAttr } from "./extractors";
import { isMatches, isSatisfies, isTransforms } from "./guards";
import isRelativeUrl from "is-relative-url";

const isImageLocation = isTransforms(
  flow(toMimeType, isMatches(IMAGE_OR_VIDEO_REGEX))
);

const handleImageUrl = (origin: string) =>
  flow(
    isImageLocation,
    fallbacksWithIdentity(
      flow(isSatisfies(isRelativeUrl), (v) => `${origin}${v}`)
    )
  );

export const image = (origin: string) =>
  tryForEach(handleImageUrl(origin))(
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
