import { fallbacksWIthDefault, optionFlow } from "../function";
import { isNull } from '../guards';
import { queryAttr } from './extractors';

export const title = fallbacksWIthDefault(
  null,
  queryAttr('meta[property="og:title" i]', "content"),
  queryAttr('meta[name="twitter:title" i]', "content"),
  queryAttr('meta[property="twitter:title"]', "content"),
  queryAttr('meta[name="title"]', "content"),
)