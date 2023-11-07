import { monaco } from "@/lib/editor";
import { Box } from "@mui/material";
import { createContext, useEffect, useRef } from "react";

export interface EditorProps {
  initialValue: string;
  prepend?: JSX.Element;
  append?: JSX.Element;
}

interface EditorState {
  model: monaco.editor.ITextModel;
  editor: monaco.editor.IStandaloneCodeEditor;
}

export const StateRefContext = createContext<{ current: EditorState | undefined }>({
  current: undefined,
});

export function Editor({ initialValue, append, prepend }: EditorProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<EditorState>();
  useEffect(() => {
    if (boxRef.current) {
      const model = monaco.editor.createModel(initialValue, "yaml");
      const editor = monaco.editor.create(boxRef.current, {
        automaticLayout: true,
        model,
      });
      stateRef.current = { model, editor };
    }
    return () => {
      if (stateRef.current) {
        stateRef.current.editor.dispose();
        stateRef.current.model.dispose();
      }
    };
  }, []);
  return (
    <StateRefContext.Provider value={stateRef}>
      {prepend}
      <Box width="auto" flexGrow={1} ref={boxRef} />
      {append}
    </StateRefContext.Provider>
  );
}
