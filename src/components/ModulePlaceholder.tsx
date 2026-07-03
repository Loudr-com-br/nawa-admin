import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import ConstructionRoundedIcon from "@mui/icons-material/ConstructionRounded";

/**
 * Placeholder de módulo — casca inicial enquanto a implementação real
 * de cada módulo (seção 5 do spec) não é construída.
 */
export default function ModulePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Box sx={{ maxWidth: 880 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {description}
      </Typography>

      <Card>
        <CardContent
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            py: 5,
            color: "text.secondary",
          }}
        >
          <ConstructionRoundedIcon color="primary" />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.primary" }}>
              Módulo em construção
            </Typography>
            <Typography variant="body2">
              A casca está pronta e navegável. A funcionalidade será implementada na
              ordem sugerida pela seção 11 do spec.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
