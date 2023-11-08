import { useContext, useState } from "react";
import { Box, Button } from "@mui/material";
import { enqueueSnackbar } from "notistack";

import { Editor, StateRefContext } from "@/components/editor";

import { SendForm } from "./send-form";

interface EditorButtonProps {
  onClick: (value: string) => void;
}

function EditorButton({ onClick }: EditorButtonProps) {
  const ref = useContext(StateRefContext);
  return (
    <Button
      variant="contained"
      onClick={() => {
        const code = ref.current?.model.getValue();
        if (!code) {
          enqueueSnackbar({
            message: "Empty code",
            variant: "error",
          });
          return;
        }
        onClick(code);
      }}
    >
      Save
    </Button>
  );
}
const initialValue = `endpoint: http://localhost:3000
schema:
  type: object
  properties:
    title:
      type: string
    url:
      type: string
    html:
      type: string
    selection:
      type: string
data:
  title:
    $op: document
    key: title
  url:
    $op: document
    key:
      - location
      - href
  html:
    $op: document
    key:
      - documentElement
      - outerHTML
  selection:
    $op: jsEval
    expression: document.getSelection().toString()
`

export function Page() {
  const [value, setValue] = useState(initialValue);
  return (
    <Box p={2} height="100vh" display="flex" flexDirection="column" gap={2}>
      <Box>Title</Box>
      <Box flexGrow={1} display="grid" gridTemplateColumns={"1fr 1fr"} gap={2}>
        <Box display="flex" flexDirection="column" gap={2}>
          <Editor
            initialValue={value}
            append={<EditorButton onClick={setValue} />}
          />
        </Box>
        <Box display="flex" flexDirection="column" gap={2}>
          <SendForm config={value} />
        </Box>
      </Box>
    </Box>
  );
}
