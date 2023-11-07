import MonacoEditor from "@monaco-editor/react";

export function Editor() {
  return <MonacoEditor defaultPath='conf.yaml' defaultLanguage="yaml" />;
}
