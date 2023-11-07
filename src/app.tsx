import { useContext } from "react";
import { Box, Button } from "@mui/material";

import { Editor, StateRefContext } from "./components/editor";
import { Form } from "./components/form";
import { makeAppOperatorResolver } from './operator'
import { parse } from 'yaml';
import { traverseJsonLike } from './lib/json-like-traverser';
import { enqueueSnackbar } from 'notistack';

function makeOperator(data: string) {
  const code = parse(data)
  const resolver = makeAppOperatorResolver();
  return traverseJsonLike(resolver, code)
}


function EditorButton() {
  const ref = useContext(StateRefContext);
  return (
    <Button
      variant="contained"
      onClick={() => {
        const code = ref.current?.model.getValue()
        if (!code) {
          enqueueSnackbar({
            message: 'Empty code',
            variant: 'error'
          })
          return
        }
        const result = makeOperator(code)
        console.log(result)
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
