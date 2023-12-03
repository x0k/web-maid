import { memo, useMemo } from "react";
import { ZodTypeAny } from "zod";
import Markdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { zodToTs, printNode } from "zod-to-ts";
import { useQuery } from "@tanstack/react-query";
import { matchSorter } from "match-sorter";

import {
  BaseOpFactory,
  OpExample,
  OpSignature,
  TaskOpFactory,
} from "@/lib/operator";

import { compileOperatorFactories } from "./operator";
import preface from "./docs-preface.md?raw";

export interface OperatorInfo {
  name: string;
  signatures: string;
  examples: string;
}

export let data: OperatorInfo[] = [];

/* eslint-disable no-inner-declarations */
if (import.meta.env.DEV) {
  function renderExample(example: OpExample) {
    return `${example.description}

\`\`\`yaml
${example.code}
\`\`\`

**Result:**

\`\`\`yaml
${example.result}
\`\`\``;
  }

  function renderSignature(signature: OpSignature) {
    return `${signature.description}

\`\`\`typescript
${signature.params}
\`\`\`

**Returns:**

\`\`\`typescript
${signature.returns}
\`\`\``;
  }

  function renderFactorySchema(factory: BaseOpFactory<ZodTypeAny, unknown>) {
    const { node } = zodToTs(factory.schema);
    return `Raw validation schema.
${
  factory instanceof TaskOpFactory
    ? "This schema describes the shape of the evaluated input."
    : "This schema describes the shape of the unevaluated input and \
additional type restrictions will be applied at runtime."
}

\`\`\`typescript
interface Config ${printNode(node)}
\`\`\``;
  }

  function prerenderFactory(
    fullName: string,
    factory: BaseOpFactory<ZodTypeAny, unknown>
  ): OperatorInfo {
    return {
      name: fullName,
      signatures: factory.signatures.length
        ? factory.signatures.map(renderSignature).join("\n\n")
        : renderFactorySchema(factory),
      examples: factory.examples.length
        ? factory.examples.map(renderExample).join("\n\n")
        : "",
    };
  }
  //@ts-expect-error empty deps is ok for metadata extraction
  const factories = compileOperatorFactories({});
  data = Object.entries(factories).map(([name, factory]) =>
    prerenderFactory(name, factory)
  );
}

export function renderOperator(operator: OperatorInfo) {
  return `## Operator \`${operator.name}\`

### Signatures

${operator.signatures}${
    operator.examples
      ? `

### Examples

${operator.examples}`
      : ""
  }`;
}

export interface DocsProps {
  className?: string;
  search?: string;
}

export const Docs = memo(({ className = "", search = "" }: DocsProps) => {
  const { data: operators } = useQuery<OperatorInfo[]>({
    queryKey: ["/operators.json"],
    queryFn: () => fetch("/operators.json").then((res) => res.json()),
    initialData: data,
    enabled: import.meta.env.PROD,
  });
  const renders = useMemo(() => {
    const renders: Record<string, string> = {};
    for (const op of operators) {
      renders[op.name] = renderOperator(op);
    }
    return renders;
  }, []);
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
      components={{
        code(props) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { children, className, node, ...rest } = props;
          const match = /language-(\w+)/.exec(className || "");
          return match ? (
            // @ts-expect-error ref types conflict
            <SyntaxHighlighter
              {...rest}
              PreTag="div"
              children={String(children).replace(/\n$/, "")}
              language={match[1]}
              style={vscDarkPlus}
            />
          ) : (
            <code {...rest} className={className}>
              {children}
            </code>
          );
        },
      }}
      children={content}
    />
  );
});
