import { useState } from "react";
import { Box, Button, Typography } from "@mui/material";

import { monaco } from "@/lib/monaco";
import { Editor } from "@/components/editor";

import rawConfig from "./config.yml?raw";
import rawDocument from "./document.txt?raw";

import { SendForm } from "./send-form";

const configModel = monaco.editor.createModel(rawConfig, "yaml");

const documentModel = monaco.editor.createModel(rawDocument, "html");

export function Page() {
  const [value, setValue] = useState(() => ({
    config: configModel.getValue(),
    doc: documentModel.getValue(),
  }));
  return (
    <Box p={2} height="100vh" display="flex" flexDirection="column" gap={2}>
      <Box display="flex" flexDirection="row" gap={2} alignItems="center">
        <Typography variant="h6" flexGrow={1}>
          Scraper
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          size="small"
          onClick={() => {
            const config = configModel.getValue();
            const doc = documentModel.getValue();
            setValue({ config, doc });
          }}
        >
          Test
        </Button>
        <Button variant="contained" color="primary" size="small">
          Save
        </Button>
      </Box>
      <Box
        flexGrow={1}
        display="grid"
        gridTemplateColumns="1fr 1fr"
        gridTemplateRows="1fr 1fr"
        gap={2}
      >
        <Box gridRow="1 / 3" display="flex" flexDirection="column" gap={2}>
          <Editor model={configModel} />
        </Box>
        <Editor model={documentModel} />
        <SendForm {...value} />
      </Box>
    </Box>
  );
}
