import mt, { type Metadata } from "metascraper";
import description from "metascraper-description";
import image from "metascraper-image";
import feed from "metascraper-feed";
import lang from "metascraper-lang";
import publisher from "metascraper-publisher";
import title from "metascraper-title";
import url from "metascraper-url";
import youtube from "metascraper-youtube";
import twitter from "metascraper-twitter";
import telegram from "metascraper-telegram";
import instagram from "metascraper-instagram";
import amazon from "metascraper-amazon";
import address from "metascraper-address";
import shopping from "@samirrayani/metascraper-shopping";

export type { Metadata };

export const extractMetadata = mt([
  description(),
  image(),
  feed(),
  lang(),
  publisher(),
  title(),
  url(),
  youtube(),
  twitter(),
  telegram(),
  instagram(),
  amazon(),
  address(),
  shopping(),
]);
