"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import ArrowDropUpRoundedIcon from "@mui/icons-material/ArrowDropUpRounded";
import ArrowDropDownRoundedIcon from "@mui/icons-material/ArrowDropDownRounded";
import FiberManualRecordRoundedIcon from "@mui/icons-material/FiberManualRecordRounded";
import AreaChart from "./AreaChart";
import { formatBRL } from "@/lib/orders/format";
import {
  periodDays,
  periodLabels,
  type DashboardData,
  type DashOrder,
  type Period,
} from "@/lib/dashboard/types";

const BRAND = "#204FF1";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Delta % com direção; cor por "bom quando sobe". */
function Delta({ curr, prev, goodWhenUp = true }: { curr: number; prev: number; goodWhenUp?: boolean }) {
  if (prev === 0) return <Typography variant="caption" color="text.disabled">—</Typography>;
  const pct = ((curr - prev) / prev) * 100;
  const up = pct >= 0;
  const good = up === goodWhenUp;
  const color = Math.abs(pct) < 0.05 ? "text.secondary" : good ? "success.main" : "error.main";
  return (
    <Stack direction="row" alignItems="center" spacing={0} sx={{ color }}>
      <Typography variant="caption" sx={{ fontWeight: 600 }}>
        {Math.abs(pct).toFixed(2).replace(".", ",")}%
      </Typography>
      {up ? <ArrowDropUpRoundedIcon fontSize="small" /> : <ArrowDropDownRoundedIcon fontSize="small" />}
    </Stack>
  );
}

function Metric({ label, value, curr, prev, goodWhenUp = true }: { label: string; value: string; curr: number; prev: number; goodWhenUp?: boolean }) {
  return (
    <Box sx={{ flex: 1, minWidth: 150, px: 2.5, py: 0.5 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{label}</Typography>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.25 }}>{value}</Typography>
      <Delta curr={curr} prev={prev} goodWhenUp={goodWhenUp} />
    </Box>
  );
}

function inRange(o: DashOrder, from: number, to: number) {
  const t = new Date(o.createdAt).getTime();
  return t >= from && t < to;
}

export default function DashboardClient({ data }: { data: DashboardData }) {
  const [period, setPeriod] = useState<Period>("30d");

  const view = useMemo(() => {
    const orders = data.orders;
    const refNow = orders.length
      ? Math.max(...orders.map((o) => new Date(o.createdAt).getTime()))
      : Date.now();
    const days = periodDays[period];
    const span = days * 86400000;
    const from = refNow - span;
    const prevFrom = from - span;

    const curr = orders.filter((o) => inRange(o, from, refNow + 1));
    const prev = orders.filter((o) => inRange(o, prevFrom, from));

    const revenue = (list: DashOrder[]) => list.filter((o) => o.paymentStatus === "paid").reduce((s, o) => s + o.total, 0);
    const paidCount = (list: DashOrder[]) => list.filter((o) => o.paymentStatus === "paid").length;
    const failed = (list: DashOrder[]) => list.filter((o) => o.status === "failed").length;

    const currRevenue = revenue(curr);
    const prevRevenue = revenue(prev);
    const currTicket = paidCount(curr) ? currRevenue / paidCount(curr) : 0;
    const prevTicket = paidCount(prev) ? prevRevenue / paidCount(prev) : 0;

    // Série temporal
    const hourly = period === "today";
    const labels: string[] = [];
    const countSeries: number[] = [];
    const revSeries: number[] = [];
    if (hourly) {
      const base = new Date(refNow);
      base.setHours(0, 0, 0, 0);
      for (let h = 0; h <= new Date(refNow).getHours(); h++) {
        labels.push(`${pad(h)}h`);
        const start = base.getTime() + h * 3600000;
        const bucket = curr.filter((o) => { const t = new Date(o.createdAt).getTime(); return t >= start && t < start + 3600000; });
        countSeries.push(bucket.length);
        revSeries.push(bucket.filter((o) => o.paymentStatus === "paid").reduce((s, o) => s + o.total, 0));
      }
    } else {
      // Buckets diários por intervalo de timestamp (robusto a fuso; labels e
      // séries garantidamente do mesmo tamanho).
      const startOfDay = (ts: number) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
      const todayStart = startOfDay(refNow);
      const daily: { ts: number; c: number; r: number }[] = [];
      for (let i = 0; i < days; i++) {
        const dayStart = todayStart - i * 86400000;
        const dayEnd = dayStart + 86400000;
        let c = 0, r = 0;
        for (const o of curr) {
          const t = new Date(o.createdAt).getTime();
          if (t >= dayStart && t < dayEnd) { c += 1; if (o.paymentStatus === "paid") r += o.total; }
        }
        daily.push({ ts: dayStart, c, r });
      }
      daily.reverse(); // do mais antigo ao mais recente
      for (const b of daily) {
        const d = new Date(b.ts);
        labels.push(`${pad(d.getDate())}/${pad(d.getMonth() + 1)}`);
        countSeries.push(b.c);
        revSeries.push(b.r);
      }
    }

    // Top produtos
    const prodMap = new Map<string, number>();
    for (const o of curr) for (const it of o.items) {
      prodMap.set(it.name, (prodMap.get(it.name) ?? 0) + it.unitPrice * it.quantity);
    }
    const topProducts = [...prodMap.entries()].map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
    const topMax = topProducts[0]?.revenue ?? 1;

    // Funil
    const criados = curr.length;
    const pagos = curr.filter((o) => o.paymentStatus === "paid").length;
    const producao = curr.filter((o) => ["in_production", "shipped", "delivered"].includes(o.status)).length;
    const enviados = curr.filter((o) => ["shipped", "delivered"].includes(o.status)).length;
    const entregues = curr.filter((o) => o.status === "delivered").length;
    const funnel = [
      { label: "Pedidos criados", value: criados },
      { label: "Pagos", value: pagos },
      { label: "Em produção", value: producao },
      { label: "Enviados", value: enviados },
      { label: "Entregues", value: entregues },
    ];

    return {
      currRevenue, prevRevenue, currTicket, prevTicket,
      currOrders: curr.length, prevOrders: prev.length,
      currFailed: failed(curr), prevFailed: failed(prev),
      pendingPayment: curr.filter((o) => o.paymentStatus === "pending").length,
      labels, countSeries, revSeries, topProducts, topMax, funnel,
    };
  }, [data.orders, period]);

  return (
    <Box>
      {/* Cabeçalho */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ mb: 2.5 }}>
        <Typography variant="h4" component="h1">Visão geral</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: "success.main" }}>
            <FiberManualRecordRoundedIcon sx={{ fontSize: 10 }} />
            <Typography variant="caption" sx={{ fontWeight: 600 }}>Em tempo real</Typography>
          </Stack>
          <TextField select size="small" label="Período" value={period} onChange={(e) => setPeriod(e.target.value as Period)} sx={{ minWidth: 140 }}>
            {(Object.keys(periodLabels) as Period[]).map((p) => <MenuItem key={p} value={p}>{periodLabels[p]}</MenuItem>)}
          </TextField>
        </Stack>
      </Stack>

      {/* Métricas */}
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, lg: 9 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ px: 0 }}>
              <Stack direction={{ xs: "column", md: "row" }} divider={<Divider orientation="vertical" flexItem />} spacing={{ xs: 2, md: 0 }}>
                <Metric label="Receita" value={formatBRL(view.currRevenue)} curr={view.currRevenue} prev={view.prevRevenue} />
                <Metric label="Ticket médio" value={formatBRL(view.currTicket)} curr={view.currTicket} prev={view.prevTicket} />
                <Metric label="Pedidos" value={String(view.currOrders)} curr={view.currOrders} prev={view.prevOrders} />
                <Metric label="Pedidos cancelados" value={String(view.currFailed)} curr={view.currFailed} prev={view.prevFailed} goodWhenUp={false} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 3 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Stack direction="row" divider={<Divider orientation="vertical" flexItem />} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{view.pendingPayment}</Typography>
                  <Typography variant="caption" color="text.secondary">Pagamento pendente</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{data.activeSubscriptions}</Typography>
                  <Typography variant="caption" color="text.secondary">Assinaturas ativas</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráficos + top produtos */}
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Pedidos por dia</Typography>
              <AreaChart labels={view.labels} values={view.countSeries} color={BRAND} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Receita por dia</Typography>
              <AreaChart labels={view.labels} values={view.revSeries} color="#0619AD" valueFormatter={(v) => formatBRL(v)} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 3 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>Produtos com maior receita</Typography>
              <Stack spacing={1.5}>
                {view.topProducts.map((p) => (
                  <Box key={p.name}>
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>{p.name}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>{formatBRL(p.revenue)}</Typography>
                    </Stack>
                    <Box sx={{ mt: 0.5, height: 4, borderRadius: 2, bgcolor: "var(--color-blue-50)", overflow: "hidden" }}>
                      <Box sx={{ height: "100%", width: `${(p.revenue / view.topMax) * 100}%`, bgcolor: BRAND }} />
                    </Box>
                  </Box>
                ))}
                {view.topProducts.length === 0 && <Typography variant="body2" color="text.secondary">Sem dados no período.</Typography>}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Funil */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Funil de pedidos</Typography>
          <Stack direction={{ xs: "column", md: "row" }} divider={<Divider orientation="vertical" flexItem />} spacing={{ xs: 2, md: 0 }}>
            {view.funnel.map((stage, i) => {
              const base = view.funnel[0].value || 1;
              const pct = (stage.value / base) * 100;
              return (
                <Box key={stage.label} sx={{ flex: 1, px: { md: 2 }, textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary">{stage.label}</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>{stage.value}</Typography>
                  <Typography variant="body2" sx={{ color: i === 0 ? "text.primary" : "primary.main", fontWeight: 600 }}>
                    {pct.toFixed(1).replace(".", ",")}%
                  </Typography>
                  <Box sx={{ mt: 1, height: 6, borderRadius: 3, bgcolor: "var(--color-blue-50)", overflow: "hidden" }}>
                    <Box sx={{ height: "100%", width: `${pct}%`, bgcolor: BRAND }} />
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
