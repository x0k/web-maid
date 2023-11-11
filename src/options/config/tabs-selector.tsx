import { Autocomplete, Box, TextField } from "@mui/material";

import { Tab } from "@/shared/extension";

export interface TabsSelectorProps {
  tabs: Tab[];
  selectedTab: Tab | null;
  onSelect: (tab: Tab | null) => void;
}

export function TabsSelector({
  tabs,
  selectedTab,
  onSelect,
}: TabsSelectorProps) {
  return (
    <Autocomplete
      id="tabs"
      value={selectedTab}
      options={tabs}
      getOptionLabel={(o) => o.title ?? 'Permission "tabs" not granted'}
      autoHighlight
      autoSelect
      openOnFocus
      onChange={(_, value) => onSelect(value)}
      isOptionEqualToValue={(a, b) => a.id === b.id}
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
            key={option.id}
            loading="lazy"
            width="20"
            src={option.favIconUrl}
            alt={option.title}
          />
          {option.title}
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder='Choose the tab and click on "Test" button'
          fullWidth
        />
      )}
    />
  );
}
