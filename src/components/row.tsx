import { Box } from "@mui/material";

export interface RowProps {
  children: React.ReactNode;
}

export function Row({ children }: RowProps) {
  return (
    <Box display="flex" flexDirection="row" alignItems="center" gap={2}>
      {children}
    </Box>
  );
}
