import { useEffect, useRef } from "react";
import { Box } from "@mui/material";

import { monaco } from "@/lib/monaco";

export interface EditorProps {
  model: monaco.editor.ITextModel;
}

export function Editor({ model }: EditorProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();
  useEffect(() => {
    if (boxRef.current) {
      editorRef.current = monaco.editor.create(boxRef.current, {
        minimap: {
          enabled: false,
        },
        automaticLayout: true,
        model,
        theme: "vs-dark",
        tabSize: 2,
      });
    }
    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, [model]);
  return <Box width="auto" flexGrow={1} ref={boxRef} />;
}
