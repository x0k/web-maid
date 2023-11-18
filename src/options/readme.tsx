import { ZodTypeAny } from "zod";
import Markdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

import { BaseOpFactory, OpExample } from "@/lib/operator";

import { compileOperatorFactories } from "@/shared/config/operator";

import readme from "./readme.md?raw";

function renderExample(example: OpExample) {
  return `- ${example.description}

\`\`\`yaml
${example.code}
\`\`\``;
}

function renderFactory(
  name: string,
  factory: BaseOpFactory<ZodTypeAny, unknown>
) {
  return `### Operator \`${name}\`

---

### Signature

\`\`\`typescript
${factory.signature}
\`\`\`

### Description

${factory.description}

### Examples

${
  factory.examples.length
    ? factory.examples.map(renderExample).join("\n\n")
    : "No examples provided"
}`;
}

//@ts-expect-error empty deps is ok for metadata extraction
const operators = compileOperatorFactories({});

const text = readme + Object.keys(operators)
  .map((key) => renderFactory(key, operators[key]))
  .join("\n\n");

export function Readme() {
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
      children={text}
    />
  );
}
