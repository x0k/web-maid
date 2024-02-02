import { useState, useDeferredValue } from "react";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import { X } from "lucide-react";

import { Docs } from "@/shared/config/docs";

export interface DocsProps {
  className?: string;
}

export function SearchableDocs({ className }: DocsProps) {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  return (
    <div className={`grow flex flex-col gap-4 overflow-hidden ${className}`}>
      <TextField
        size="small"
        placeholder="Search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={
          search
            ? {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setSearch("")}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                    >
                      <X />
                    </IconButton>
                  </InputAdornment>
                ),
              }
            : undefined
        }
      />
      <Docs search={deferredSearch} className="overflow-auto" />
    </div>
  );
}
