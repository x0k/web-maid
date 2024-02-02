import { HTMLAttributes, createElement, useMemo } from "react";
import { Components, ExtraProps } from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import vscDarkPlus from "react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus";

export type UpdateProps = (
  props: JSX.IntrinsicElements["h1"] & ExtraProps
) => JSX.IntrinsicElements["h1"];

export function makeCustomHeading(level: number, updateProps: UpdateProps) {
  return (props: JSX.IntrinsicElements["h1"] & ExtraProps) =>
    createElement("h" + level, updateProps(props));
}

export function code(props: HTMLAttributes<HTMLElement> & ExtraProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { children, className, node, ...rest } = props;
  const match = /language-(\w+)/.exec(className || "");
  return match ? (
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
}

export function useComponents(
  updateHeadingProps: UpdateProps
): Partial<Components> {
  return useMemo(
    () => ({
      h1: makeCustomHeading(1, updateHeadingProps),
      h2: makeCustomHeading(2, updateHeadingProps),
      h3: makeCustomHeading(3, updateHeadingProps),
      h4: makeCustomHeading(4, updateHeadingProps),
      h5: makeCustomHeading(5, updateHeadingProps),
      h6: makeCustomHeading(6, updateHeadingProps),
      code,
    }),
    [updateHeadingProps]
  );
}
