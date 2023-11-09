import { SWRResponse } from "swr";
import { Autocomplete, Box, TextField, Typography } from "@mui/material";

import { Tab } from "@/shared/extension";
import { ErrorAlert } from "@/components/error-alert";

export interface TabsSelectorProps {
  tabs: SWRResponse<Tab[]>;
  selectedTab: Tab | null;
  onSelect: (tab: Tab | null) => void;
}

export function TabsSelector({
  tabs,
  selectedTab,
  onSelect,
}: TabsSelectorProps) {
  return (
    <Box display={"flex"} flexDirection="column" gap={2}>
      <Typography>Tabs</Typography>
      {tabs.error ? (
        <ErrorAlert error={tabs.error} />
      ) : (
        <Autocomplete
          id="tabs"
          value={selectedTab}
          options={tabs.data ?? []}
          getOptionLabel={(o) => o.title ?? 'Permission "tabs" not granted'}
          autoHighlight
          autoSelect
          openOnFocus
          loading={tabs.isLoading}
          onChange={(_, value) => onSelect(value)}
          renderOption={(props, option) => (
            <Box
              component="li"
              sx={{
                "& > img": { mr: 2, flexShrink: 0, aspectRatio: "1/1" },
              }}
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
    </Box>
  );
}
