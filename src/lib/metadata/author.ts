import isRelativeUrl from "is-relative-url";

import { toCapitalized, toDate, toReplaced, toTrimmed } from "./converters";
import {
  BY_AUTHOR_REGEX,
  STRICT_AUTHOR_REGEX,
  TITLE_SEPARATOR_REGEX,
  URL_REGEX,
  flow,
  tryForEach,
} from "./core";
import { jsonldJsonQuery, queryAttr, queryTextContent } from "./extractors";
import { isMatches, isSatisfies, not } from "./guards";

const AUTHOR_MAX_LENGTH = 100;

const asAuthor = tryForEach(
  flow(
    toTrimmed,
    not(isMatches(URL_REGEX)),
    not(isSatisfies(isRelativeUrl)),
    isSatisfies((value) => value.length < AUTHOR_MAX_LENGTH),
    toReplaced(BY_AUTHOR_REGEX, ""),
    toReplaced(TITLE_SEPARATOR_REGEX, ""),
    toCapitalized
  )
);

export const author = asAuthor(
  jsonldJsonQuery("$..author.name"),
  jsonldJsonQuery("$..brand.name"),
  queryAttr('meta[name="author" i]', "content"),
  queryAttr('meta[property="author" i]', "content"),
  queryAttr('meta[property="article:author" i]', "content"),
  queryTextContent("[itemprop*='author' i] [itemprop*='name' i]"),
  queryTextContent("[itemprop*='author' i]"),
  queryTextContent("[rel*='author' i]"),
  tryForEach(isMatches(STRICT_AUTHOR_REGEX))(
    queryTextContent("a[class*='author' i]"),
    queryTextContent("[class*='author' i] a"),
    queryTextContent('a[href*="/author/" i]'),
    queryTextContent("a[class*='screenname' i]"),
    queryTextContent("[class*='author' i]"),
    flow(queryTextContent("[class*='byline' i]"), not(toDate))
  )
);
