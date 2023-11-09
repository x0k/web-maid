import { useState } from "react";
import {
  Alert,
  AlertTitle,
  Autocomplete,
  Box,
  Button,
  TextField,
  Typography,
} from "@mui/material";
import useSWR from "swr";

import { monaco } from "@/lib/monaco";
import { Editor } from "@/components/editor";
import { getAllTabs } from "@/shared/extension";

import { SendForm } from "./send-form";
import rawConfig from "./config.yml?raw";
import rawDocument from "./document.txt?raw";

const configModel = monaco.editor.createModel(rawConfig, "yaml");

const documentModel = monaco.editor.createModel(rawDocument, "html");

export function Page() {
  const tabs = useSWR("tabs", getAllTabs);
  const [value, setValue] = useState(() => ({
    key: Date.now(),
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
            setValue({ key: Date.now(), config, doc });
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
        gridTemplateRows="auto 1fr"
        overflow={"hidden"}
        gap={2}
      >
        <Box gridRow="1 / 3" display="flex" flexDirection="column" gap={2}>
          <Editor model={configModel} />
        </Box>
        {tabs.error ? (
          <Alert>
            <AlertTitle>Error</AlertTitle>
            {tabs.error instanceof Error
              ? tabs.error.message
              : String(tabs.error)}
          </Alert>
        ) : (
          <Autocomplete
            id="tabs"
            options={tabs.data ?? []}
            getOptionLabel={(o) => o.title ?? 'Permission "tabs" not granted'}
            autoHighlight
            autoSelect
            openOnFocus
            loading={tabs.isLoading}
            renderOption={(props, option) => (
              <Box
                component="li"
                sx={{ "& > img": { mr: 2, flexShrink: 0, aspectRatio: "1/1" } }}
                {...props}
                key={option.id}
              >
                <img
                  loading="lazy"
                  width="20"
                  src={option.favIconUrl}
                  alt={option.title}
                />
                {option.title}
              </Box>
            )}
            renderInput={(params) => (
              <TextField {...params} label="Tabs" fullWidth />
            )}
          />
        )}
        <SendForm {...value} />
      </Box>
    </Box>
  );
}
