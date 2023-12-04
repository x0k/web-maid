import { memo, useCallback, useMemo } from "react";
import Markdown from "react-markdown";
import { matchSorter } from "match-sorter";

import { extractTextContent } from "@/lib/react";
import { useComponents } from '@/lib/react-markdown';

import { operatorNameRegExp, renderOperator } from "./operators-info";
import { useOperators } from './react-operators-info';
import preface from "./docs-preface.md?raw";

export interface DocsProps {
  className?: string;
  search?: string;
}

export const Docs = memo(({ className = "", search = "" }: DocsProps) => {
  const { data: operators } = useOperators();
  const { renders, slugs } = useMemo(() => {
    const slugs: Record<string, string> = {};
    const renders: Record<string, string> = {};
    for (const op of operators) {
      renders[op.name] = renderOperator(op);
      slugs[op.name] = op.slug;
    }
    return { renders, slugs };
  }, []);
  const injectId = useCallback(
    (props: JSX.IntrinsicElements["h1"]) => {
      const text = extractTextContent(props.children);
      const match = text.match(operatorNameRegExp);
      return {
        id: match ? slugs[match[1]] : undefined,
        children: props.children,
      };
    },
    [slugs]
  );
  const components = useComponents(injectId);
  const fullRender = useMemo(
    () => `${preface}\n${operators.map((op) => renders[op.name]).join("\n\n")}`,
    [operators, renders]
  );
  const content = useMemo(() => {
    if (search.trim() === "") {
      return fullRender;
    }
    const matched = matchSorter(operators, search, {
      keys: ["name", "signatures", "examples"],
    });
    return (
      matched.map((op) => renders[op.name]).join("\n\n") ||
      `Nothing found for "${search}"`
    );
  }, [search, operators, renders, fullRender]);
  return (
    <Markdown
      className={`prose max-w-none prose-pre:p-0 ${className}`}
      components={components}
      children={content}
    />
  );
});
