import Markdown from "react-markdown";

import readme from "./readme.md?raw";

export function Readme() {
  return <Markdown>{readme}</Markdown>;
}
