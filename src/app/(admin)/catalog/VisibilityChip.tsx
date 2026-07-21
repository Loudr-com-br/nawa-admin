import Box from "@mui/material/Box";

/**
 * Chip discreto de destaque para itens/protocolos `medical_only` (spec §12).
 * Leve, sem peso — só marca que o item não vai à vitrine pública.
 */
export function MedicalOnlyChip() {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        height: 20,
        px: 0.9,
        borderRadius: 1,
        border: "1px solid",
        borderColor: "warning.light",
        color: "warning.dark",
        bgcolor: "transparent",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.02em",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      Só médico
    </Box>
  );
}
