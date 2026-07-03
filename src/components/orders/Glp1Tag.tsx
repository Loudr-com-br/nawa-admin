import Box from "@mui/material/Box";

/**
 * Tag discreta para itens GLP-1 — a ponte clínica/comercial (spec §4).
 * Azul da marca, mas em tom leve para não pesar.
 */
export default function Glp1Tag() {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        height: 18,
        px: 0.75,
        borderRadius: 1,
        bgcolor: "var(--color-blue-50)",
        color: "primary.main",
        fontSize: 10.5,
        fontWeight: 600,
        letterSpacing: "0.04em",
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      GLP-1
    </Box>
  );
}
