"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { DataTable, type Column } from "@/components/table/DataTable";
import Glp1Tag from "@/components/orders/Glp1Tag";
import { OrderStatusChip, PaymentStatusChip } from "@/components/orders/StatusChip";
import {
  formatBRL,
  formatDate,
  orderStatusConfig,
  orderStatusOrder,
  paymentStatusOrder,
  supplierConfig,
} from "@/lib/orders/format";
import type { Order, OrderStatus, Supplier } from "@/lib/orders/types";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function itemSummary(planName: string, count: number) {
  const extras = count - 1;
  return extras > 0
    ? `${planName} · +${extras} ${extras === 1 ? "item" : "itens"}`
    : planName;
}

const columns: Column<Order>[] = [
  {
    id: "number",
    label: "Pedido",
    sortable: true,
    sortAccessor: (o) => o.number,
    render: (o) => (
      <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: "nowrap" }}>
        {o.number}
      </Typography>
    ),
  },
  {
    id: "patient",
    label: "Paciente",
    sortable: true,
    sortAccessor: (o) => o.patient.name,
    render: (o) => (
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Avatar sx={{ width: 30, height: 30, fontSize: 12, fontWeight: 600, bgcolor: "var(--color-blue-50)", color: "primary.main" }}>
          {initials(o.patient.name)}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
            {o.patient.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {o.patient.email}
          </Typography>
        </Box>
      </Stack>
    ),
  },
  {
    id: "plan",
    label: "Plano / itens",
    sortable: true,
    sortAccessor: (o) => o.plan,
    render: (o) => (
      <Stack direction="row" spacing={0.75} alignItems="center">
        <Typography variant="body2" color="text.secondary" noWrap>
          {itemSummary(`Plano ${o.plan}`, o.items.length)}
        </Typography>
        {o.items.some((i) => i.isGlp1) && <Glp1Tag />}
      </Stack>
    ),
  },
  {
    id: "total",
    label: "Valor",
    align: "right",
    sortable: true,
    sortAccessor: (o) => o.total,
    render: (o) => (
      <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: "nowrap" }}>
        {formatBRL(o.total)}
      </Typography>
    ),
  },
  {
    id: "payment",
    label: "Pagamento",
    sortable: true,
    sortAccessor: (o) => paymentStatusOrder.indexOf(o.paymentStatus),
    render: (o) => <PaymentStatusChip status={o.paymentStatus} />,
  },
  {
    id: "status",
    label: "Status",
    sortable: true,
    sortAccessor: (o) => orderStatusOrder.indexOf(o.status),
    render: (o) => <OrderStatusChip status={o.status} />,
  },
  {
    id: "createdAt",
    label: "Data",
    sortable: true,
    sortAccessor: (o) => new Date(o.createdAt).getTime(),
    render: (o) => (
      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
        {formatDate(o.createdAt)}
      </Typography>
    ),
  },
];

export default function OrdersClient({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [supplier, setSupplier] = useState<Supplier | "all">("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (supplier !== "all" && !o.items.some((i) => i.supplier === supplier))
        return false;
      if (!q) return true;
      return (
        o.number.toLowerCase().includes(q) ||
        o.patient.name.toLowerCase().includes(q) ||
        o.plan.toLowerCase().includes(q)
      );
    });
  }, [orders, search, status, supplier]);

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 0.5 }}>
        Pedidos
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Todos os pedidos da operação — paciente, plano, itens, pagamento e status de produção.
      </Typography>

      <Card>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}
        >
          <TextField
            placeholder="Buscar por número, paciente ou plano"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ flex: 1, minWidth: 240 }}
          />
          <TextField
            select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus | "all")}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="all">Todos os status</MenuItem>
            {orderStatusOrder.map((s) => (
              <MenuItem key={s} value={s}>
                {orderStatusConfig[s].label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Fornecedor"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value as Supplier | "all")}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="all">Todos os fornecedores</MenuItem>
            <MenuItem value="botane">{supplierConfig.botane.label}</MenuItem>
            <MenuItem value="partner">{supplierConfig.partner.label}</MenuItem>
          </TextField>
        </Stack>

        <DataTable
          columns={columns}
          rows={filtered}
          getRowId={(o) => o.id}
          onRowClick={(o) => router.push(`/orders/${o.id}`)}
          initialSort={{ columnId: "createdAt", dir: "desc" }}
          minWidth={900}
          countLabel={["pedido", "pedidos"]}
          emptyMessage="Nenhum pedido encontrado com os filtros atuais."
        />
      </Card>
    </Box>
  );
}
