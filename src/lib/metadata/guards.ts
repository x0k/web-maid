import { Transform } from "./core";
import { toMimeType } from "./converters";

export const isImageUrl: Transform<string, string> = (value) => {
  const mimeType = toMimeType(value);
  return mimeType && (/(image|video)/.test(mimeType) ? value : null);
};
