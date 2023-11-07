import { Box } from "@mui/material";
import { Editor } from "./components/editor";
import { Form } from "./components/form";

export function App() {
  return (
    <Box p={2} height="100vh" display="flex" flexDirection="column" gap={2}>
      <Box>Title</Box>
      <Box flexGrow={1} display="grid" gridTemplateColumns={"1fr 1fr"} gap={2}>
        <Editor />
        <Form />
      </Box>
    </Box>
  );
}
