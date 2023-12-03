import { forwardRef, useEffect, useRef } from "react";

import { monaco } from "@/lib/monaco";

export interface EditorProps {
  model: monaco.editor.ITextModel | null;
  actions?: monaco.editor.IActionDescriptor[];
}

export const Editor = forwardRef<
  monaco.editor.IStandaloneCodeEditor,
  EditorProps
>(({ model, actions }, ref) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();
  useEffect(() => {
    let disposables: monaco.IDisposable[] = [];
    if (boxRef.current) {
      const editor = monaco.editor.create(boxRef.current, {
        readOnly: model === null,
        minimap: {
          enabled: false,
        },
        automaticLayout: true,
        model,
        theme: "vs-dark",
        tabSize: 2,
      });
      if (actions) {
        for (const action of actions) {
          disposables.push(editor.addAction(action));
        }
      }
      editorRef.current = editor;
      if (ref) {
        if (typeof ref === "function") {
          ref(editor);
        } else {
          ref.current = editor;
        }
      }
    }
    return () => {
      for (const disposable of disposables) {
        disposable.dispose();
      }
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
    // Ref can be a callback
  }, [model, actions]);
  return <div className="w-auto grow bg-neutral-900" ref={boxRef} />;
});
