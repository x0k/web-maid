import { toCapitalized, toDate, toReplaced } from "./converters";
import {
  BY_AUTHOR_REGEX,
  STRICT_AUTHOR_REGEX,
  TITLE_SEPARATOR_REGEX,
  flow,
  tryForEach,
} from "./core";
import { jsonldJsonQuery, queryAttr, queryTextContent } from "./extractors";
import { isAuthor, isMatches, not } from "./guards";

export const author = tryForEach(
  flow(
    isAuthor,
    toReplaced(BY_AUTHOR_REGEX, ""),
    toReplaced(TITLE_SEPARATOR_REGEX, ""),
    toCapitalized
  )
)(
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
