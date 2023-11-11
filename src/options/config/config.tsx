import { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import useSWRMutation from "swr/mutation";
import useSWR from "swr";

import { monaco } from "@/lib/monaco";
import { stringifyError } from "@/lib/error";
import { Editor } from "@/components/editor";
import { ErrorAlert } from "@/components/error-alert";

import {
  Tab,
  evalForTab,
  getAllTabs,
  loadSyncSettings,
  saveSyncSettings,
} from "@/shared/extension";

import { TabsSelector } from "./tabs-selector";
import { Readme } from "./readme";
import { stringify } from "yaml";

const configModel = monaco.editor.createModel("", "yaml");

function showError(err: unknown) {
  enqueueSnackbar({
    variant: "error",
    message: stringifyError(err),
  });
}

async function runEvalForTab(tab: Tab | null, { arg }: { arg: string }) {
  if (!tab) {
    throw new Error("Tab not selected");
  }
  return evalForTab(tab.id, arg);
}

async function saveConfig(_: string, { arg }: { arg: string }) {
  await saveSyncSettings({ config: arg });
}

const initialTabs: Tab[] = [];

export function Config() {
  const tabs = useSWR("tabs", getAllTabs, {
    fallbackData: initialTabs,
  });
  const [selectedTab, selectTab] = useState<Tab | null>(null);
  const evalMutation = useSWRMutation(selectedTab, runEvalForTab, {});
  useSWR("settings/sync", loadSyncSettings, {
    revalidateOnFocus: false,
    onSuccess({ config }) {
      configModel.setValue(config);
    },
    onError: showError,
  });
  const configMutation = useSWRMutation("settings/sync", saveConfig, {
    onError: showError,
  });

  return (
    <Box
      flexGrow={1}
      display="grid"
      gridTemplateColumns="1fr 1fr"
      gridTemplateRows="auto 1fr"
      overflow={"hidden"}
      gap={2}
    >
      <Box gridRow="1 / 3" display="flex" flexDirection="column" gap={2}>
        <Box display="flex" flexDirection="row" gap={2} alignItems="center">
          <Typography flexGrow={1}>Config</Typography>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => {
              configMutation.trigger(configModel.getValue());
            }}
          >
            Save
          </Button>
        </Box>
        <Editor model={configModel} />
      </Box>
      <Box display="flex" flexDirection="column" gap={2}>
        <Box display="flex" flexDirection="row" gap={2} alignItems="center">
          <Typography flexGrow={1}>Tabs</Typography>
          <Button
            variant="contained"
            color="warning"
            size="small"
            onClick={() => {
              evalMutation.trigger(configModel.getValue());
            }}
            disabled={evalMutation.isMutating || !selectedTab}
          >
            Test
          </Button>
        </Box>
        {tabs.error ? (
          <ErrorAlert error={tabs.error} />
        ) : (
          <TabsSelector
            tabs={tabs.data}
            selectedTab={selectedTab}
            onSelect={selectTab}
          />
        )}
      </Box>
      <Box overflow={"auto"}>
        {evalMutation.error ? (
          <ErrorAlert error={evalMutation.error} />
        ) : evalMutation.isMutating ? (
          <Typography>Loading...</Typography>
        ) : !evalMutation.data ? (
          <Readme />
        ) : (
          <pre>
            <code>{stringify(evalMutation.data)}</code>
          </pre>
        )}
      </Box>
    </Box>
  );
}
