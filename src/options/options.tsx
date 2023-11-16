import { Box } from "@mui/material";

import { Config } from "./config";

export function OptionsPage() {
  return (
    <Box height="100vh" display="flex" flexDirection="column" gap={2} p={2}>
      <Config />
    </Box>
  );
}
