import { memo, useMemo } from "react";
import { ZodTypeAny } from "zod";
import Markdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { zodToTs, printNode } from "zod-to-ts";
import useSWR from "swr";

import {
  BaseOpFactory,
  OpExample,
  OpSignature,
  TaskOpFactory,
} from "@/lib/operator";

import { compileOperatorFactories } from "@/shared/config/operator";

export let details = "";

/* eslint-disable no-inner-declarations */
if (import.meta.env.DEV) {
  function renderExample(example: OpExample) {
    return `- ${example.description}

\`\`\`yaml
${example.code}
\`\`\`

**Result:**

\`\`\`yaml
${example.result}
\`\`\``;
  }

  function renderSignature(signature: OpSignature) {
    return `- ${signature.description}

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
    return `- Raw validation schema.
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

  function renderFactory(
    name: string,
    factory: BaseOpFactory<ZodTypeAny, unknown>
  ) {
    return `## Operator \`${name}\`

---

### Signatures

${
  factory.signatures.length
    ? factory.signatures.map(renderSignature).join("\n\n")
    : renderFactorySchema(factory)
}

### Examples

${
  factory.examples.length
    ? factory.examples.map(renderExample).join("\n\n")
    : "No examples provided"
}`;
  }
  //@ts-expect-error empty deps is ok for metadata extraction
  const operators = compileOperatorFactories({});

  details = Object.keys(operators)
    .map((key) => renderFactory(key, operators[key]))
    .join("\n\n");
  /* eslint-enable no-inner-declarations */
}

export const Docs = memo(() => {
  const { data: preface } = useSWR(
    "/operators.md",
    (url) => fetch(url).then((res) => res.text()),
    {
      fallbackData: "# Operators\n\n",
    }
  );
  const content = useMemo(() => `${preface}\n${details}`, [preface]);
  return (
    <Markdown
      className="prose max-w-none prose-pre:p-0"
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
