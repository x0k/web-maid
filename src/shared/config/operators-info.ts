import GithubSlugger from "github-slugger";
import { ZodTypeAny } from "zod";
import { printNode, zodToTs } from "zod-to-ts";

import {
  BaseOpFactory,
  OpExample,
  OpSignature,
  TaskOpFactory,
} from "@/lib/operator";

import { compileOperatorFactories } from "./operator";

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


export const operatorNameRegExp = /Operator (.+)\b/;

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