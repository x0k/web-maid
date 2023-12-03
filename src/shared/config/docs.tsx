import {
  Children,
  PropsWithChildren,
  createElement,
  memo,
  useMemo,
} from "react";
import { ZodTypeAny } from "zod";
import Markdown, { Components } from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { zodToTs, printNode } from "zod-to-ts";
import { useQuery } from "@tanstack/react-query";
import { matchSorter } from "match-sorter";
import GithubSlugger from "github-slugger";

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
  slug: string;
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
    factory: BaseOpFactory<ZodTypeAny, unknown>,
    slugger: GithubSlugger
  ): OperatorInfo {
    return {
      name: fullName,
      slug: slugger.slug(fullName),
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
  const slugger = new GithubSlugger();
  data = Object.entries(factories).map(([name, factory]) =>
    prerenderFactory(name, factory, slugger)
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

export function useOperators() {
  return useQuery<OperatorInfo[]>({
    queryKey: ["/operators.json"],
    queryFn: () => fetch("/operators.json").then((res) => res.json()),
    initialData: data,
    enabled: import.meta.env.PROD,
  });
}

export interface DocsProps {
  className?: string;
  search?: string;
}

function flatten(
  text: string,
  child: ReturnType<typeof Children.toArray>[number]
): string {
  return typeof child === "string" || typeof child === "number"
    ? text + child
    : Children.toArray(
        Symbol.iterator in child ? child : child.props.children
      ).reduce(flatten, text);
}

const operatorName = /Operator (.+)\b/;
function makeHeadingRenderer(level: number, slugs: Record<string, string>) {
  return (props: PropsWithChildren) => {
    const children = Children.toArray(props.children);
    const text = children.reduce(flatten, "");
    const match = text.match(operatorName);
    console.log(text, match);
    if (!match) {
      return createElement("h" + level, { children: props.children });
    }
    return createElement(
      "h" + level,
      {
        id: slugs[match[1]],
      },
      props.children
    );
  };
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
  const components: Partial<Components> = useMemo(
    () => ({
      h1: makeHeadingRenderer(1, slugs),
      h2: makeHeadingRenderer(2, slugs),
      h3: makeHeadingRenderer(3, slugs),
      h4: makeHeadingRenderer(4, slugs),
      h5: makeHeadingRenderer(5, slugs),
      h6: makeHeadingRenderer(6, slugs),
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
    }),
    [slugs]
  );
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
