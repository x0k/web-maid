import { useContext } from "react";
import { Box, Button } from "@mui/material";

import { Editor, StateRefContext } from "./components/editor";
import { Form } from "./components/form";

function EditorButton() {
  const ref = useContext(StateRefContext);
  return (
    <Button
      variant="contained"
      onClick={() => {
        console.log(ref.current?.model.getValue());
      }}
    >
      Click
    </Button>
  );
}

export function App() {
  return (
    <Box p={2} height="100vh" display="flex" flexDirection="column" gap={2}>
      <Box>Title</Box>
      <Box flexGrow={1} display="grid" gridTemplateColumns={"1fr 1fr"} gap={2}>
        <Box display="flex" flexDirection="column" gap={2}>
          <Editor initialValue="" append={<EditorButton />} />
        </Box>
        <Form />
      </Box>
    </Box>
  );
}
