import { RefObject, useMemo } from "react";
import { stringify } from "yaml";

import { monaco } from "@/lib/monaco";
import { ILogger } from "@/lib/logger";
import { prepareForSerialization } from './serialization';

export class ReactMonacoLogger implements ILogger {
  constructor(
    private readonly editorRef: RefObject<monaco.editor.IStandaloneCodeEditor>
  ) {}

  log(arg: unknown): void {
    const { current: editor } = this.editorRef;
    if (!editor) {
      return;
    }
    const model = editor.getModel();
    if (!model) {
      return;
    }
    const lc = model.getLineCount();
    model.applyEdits([
      {
        range: {
          startLineNumber: lc,
          endLineNumber: lc,
          startColumn: 1,
          endColumn: 1,
        },
        text: `---\n${stringify({
          [new Date().toISOString()]: prepareForSerialization(arg),
        })}`,
      },
    ]);
    editor.trigger("fold", "editor.foldLevel2", {});
    editor.revealLine(lc + 1);
  }
}

export function useMonacoLogger(
  editorRef: RefObject<monaco.editor.IStandaloneCodeEditor>
) {
  return useMemo(() => new ReactMonacoLogger(editorRef), [editorRef]);
}
