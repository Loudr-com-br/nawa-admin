"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

/**
 * Gráfico de área via SVG inline — responsivo (viewBox), determinístico e sem
 * medição de largura (evita o bug de render do MUI X Charts em container flex).
 */
export default function AreaChart({
  labels,
  values,
  color,
  valueFormatter = (v) => String(v),
  height = 180,
}: {
  labels: string[];
  values: number[];
  color: string;
  valueFormatter?: (v: number) => string;
  height?: number;
}) {
  const n = values.length;
  const max = Math.max(1, ...values);
  const W = 100;
  const H = 40;
  const stepX = n > 1 ? W / (n - 1) : W;
  const pts = values.map((v, i) => [i * stepX, H - (v / max) * H] as const);
  const line = pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `0,${H} ${line} ${(W).toFixed(2)},${H}`;

  // rótulos do eixo x: ~5 posições distribuídas
  const tickCount = Math.min(5, n);
  const ticks = Array.from({ length: tickCount }, (_, k) => {
    const i = Math.round((k / (tickCount - 1 || 1)) * (n - 1));
    return labels[i] ?? "";
  });

  return (
    <Box>
      <Box sx={{ position: "relative", height }}>
        {/* valor máximo */}
        <Typography variant="caption" color="text.disabled" sx={{ position: "absolute", top: 0, left: 0 }}>
          {valueFormatter(max)}
        </Typography>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          width="100%"
          height={height}
          style={{ display: "block", overflow: "visible" }}
        >
          <polygon points={area} fill={color} fillOpacity={0.1} />
          <polyline points={line} fill="none" stroke={color} strokeWidth={1.4} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
        {ticks.map((t, i) => (
          <Typography key={i} variant="caption" color="text.secondary">{t}</Typography>
        ))}
      </Stack>
    </Box>
  );
}
