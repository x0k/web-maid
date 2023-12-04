import { Children, ReactNode } from "react";

function appendTextContent(
  text: string,
  child: ReturnType<typeof Children.toArray>[number]
): string {
  return typeof child === "string" || typeof child === "number"
    ? text + child
    : Children.toArray(
        Symbol.iterator in child ? child : child.props.children
      ).reduce(appendTextContent, text);
}

export function extractTextContent(node?: ReactNode) {
  return Children.toArray(node).reduce(appendTextContent, "");
}
