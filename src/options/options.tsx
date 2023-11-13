import { useState } from "react";
import { Box, Button, Typography } from "@mui/material";

import { Row } from "@/components/row";

import { Config } from "./config";
import { Secrets } from "./secrets";

export function OptionsPage() {
  const [isConfig, setIsConfig] = useState(true);
  return (
    <Box height="100vh" display="flex" flexDirection="column" gap={2} p={2}>
      <Row>
        <Typography flexGrow={1} variant="h5">
          Scraper
        </Typography>
        <Button
          variant="text"
          color="secondary"
          size="small"
          onClick={() => {
            setIsConfig((isConfig) => !isConfig);
          }}
        >
          {isConfig ? "Edit secrets" : "Edit config"}
        </Button>
      </Row>
      {isConfig ? <Config /> : <Secrets />}
    </Box>
  );
}
