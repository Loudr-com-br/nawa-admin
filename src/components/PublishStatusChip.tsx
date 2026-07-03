import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ContentStatus } from "@/lib/catalog/types";

/** Estado de publicação como ponto discreto + rótulo — publish model (§2). */
export default function PublishStatusChip({ status }: { status: ContentStatus }) {
  const published = status === "published";
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          bgcolor: published ? "#22C55E" : "#94A3B8",
          flexShrink: 0,
        }}
      />
      <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
        {published ? "Publicado" : "Rascunho"}
      </Typography>
    </Box>
  );
}
