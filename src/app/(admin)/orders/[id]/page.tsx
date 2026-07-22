import { notFound } from "next/navigation";
import Link from "next/link";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import ScienceRoundedIcon from "@mui/icons-material/ScienceRounded";
import FactoryRoundedIcon from "@mui/icons-material/FactoryRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import ReceiptRoundedIcon from "@mui/icons-material/ReceiptRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import { getOrderById } from "@/lib/orders/queries";
import Glp1Tag from "@/components/orders/Glp1Tag";
import {
  formatBRL,
  formatDate,
  formatDateTime,
  supplierConfig,
} from "@/lib/orders/format";
import { OrderStatusChip, PaymentStatusChip } from "@/components/orders/StatusChip";
import { SectionCard, DefRow } from "@/components/orders/DetailPrimitives";

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const itemsTotal = order.items.reduce(
    (sum, i) => sum + i.unitPrice * i.quantity,
    0
  );

  return (
    <Box sx={{ maxWidth: 1160 }}>
      {/* Voltar */}
      <Button
        component={Link}
        href="/orders"
        startIcon={<ArrowBackRoundedIcon />}
        sx={{ mb: 2, color: "text.secondary" }}
        size="small"
      >
        Pedidos
      </Button>

      {/* Cabeçalho */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="h4" component="h1">
              {order.number}
            </Typography>
            <OrderStatusChip status={order.status} />
            <PaymentStatusChip status={order.paymentStatus} />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Criado em {formatDateTime(order.createdAt)}
          </Typography>
        </Box>
        <Button variant="outlined" disabled>
          Ações
        </Button>
      </Stack>

      <Grid container spacing={2.5}>
        {/* Coluna principal */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={2.5}>
            {/* Itens */}
            <SectionCard title="Itens do pedido" icon={Inventory2RoundedIcon}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ "& th": { color: "text.secondary", fontWeight: 500 } }}>
                    <TableCell>Item</TableCell>
                    <TableCell>Fornecedor</TableCell>
                    <TableCell align="center">Qtd</TableCell>
                    <TableCell align="right">Unit.</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id} sx={{ "&:last-child td": { border: 0 } }}>
                      <TableCell>
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {item.name}
                          </Typography>
                          {item.isGlp1 && <Glp1Tag />}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {item.supplier ? (
                          <Typography variant="body2" color="text.secondary">
                            {supplierConfig[item.supplier].label}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">{item.quantity}</TableCell>
                      <TableCell align="right">{formatBRL(item.unitPrice)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500 }}>
                        {formatBRL(item.unitPrice * item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Divider sx={{ my: 1.5 }} />
              <Stack direction="row" justifyContent="flex-end" spacing={4} sx={{ pr: 1 }}>
                <Typography variant="subtitle1" color="text.secondary">
                  Total
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "primary.main" }}>
                  {formatBRL(itemsTotal)}
                </Typography>
              </Stack>
            </SectionCard>

            {/* Protocolo e prescrição */}
            <SectionCard title="Protocolo e prescrição" icon={ScienceRoundedIcon}>
              <DefRow label="Protocolo">
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {order.protocolName ?? "—"}
                </Typography>
              </DefRow>
              <DefRow label="Prescrição">
                <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: "monospace" }}>
                  {order.prescriptionId ?? "—"}
                </Typography>
              </DefRow>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mt: 1.5, color: "text.secondary" }}
              >
                <LockRoundedIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption">
                  Prescrição não é editável após emissão. Correção gera nova versão (§8.8).
                </Typography>
              </Stack>
            </SectionCard>

            {/* Histórico */}
            <SectionCard title="Histórico do pedido" icon={HistoryRoundedIcon}>
              <Stack spacing={0}>
                {order.history.map((ev, idx) => {
                  const last = idx === order.history.length - 1;
                  return (
                    <Stack key={idx} direction="row" spacing={2}>
                      {/* trilha */}
                      <Stack alignItems="center" sx={{ width: 16 }}>
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            bgcolor: last ? "primary.main" : "grey.400",
                            mt: 0.5,
                          }}
                        />
                        {!last && <Box sx={{ flex: 1, width: 2, bgcolor: "divider" }} />}
                      </Stack>
                      <Box sx={{ pb: last ? 0 : 2.5, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {ev.label}
                        </Typography>
                        {ev.description && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {ev.description}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.disabled">
                          {formatDateTime(ev.at)}
                        </Typography>
                      </Box>
                    </Stack>
                  );
                })}
              </Stack>
            </SectionCard>
          </Stack>
        </Grid>

        {/* Aside */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2.5}>
            {/* Paciente */}
            <SectionCard
              title="Paciente"
              icon={PersonRoundedIcon}
              action={
                <Button component={Link} href="#" size="small" disabled>
                  Ver ficha
                </Button>
              }
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                <Avatar sx={{ bgcolor: "var(--color-blue-50)", color: "primary.main", fontWeight: 600 }}>
                  {initials(order.patient.name)}
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {order.patient.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {order.patient.email}
                  </Typography>
                </Box>
              </Stack>
              <DefRow label="Telefone">
                <Typography variant="body2">{order.patient.phone}</Typography>
              </DefRow>
            </SectionCard>

            {/* Plano */}
            <SectionCard title="Plano" icon={RouteRoundedIcon}>
              <DefRow label="Plano">
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {order.plan}
                </Typography>
              </DefRow>
            </SectionCard>

            {/* Pagamento */}
            <SectionCard title="Pagamento" icon={PaymentsRoundedIcon}>
              <DefRow label="Status">
                <PaymentStatusChip status={order.paymentStatus} />
              </DefRow>
              <DefRow label="Método">
                <Typography variant="body2">{order.paymentMethod}</Typography>
              </DefRow>
              <DefRow label="Total">
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatBRL(order.total)}
                </Typography>
              </DefRow>
            </SectionCard>

            {/* Produção Botane */}
            <SectionCard title="Produção Botane" icon={FactoryRoundedIcon}>
              <DefRow label="Referência">
                {order.botaneOrderRef ? (
                  <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: "monospace" }}>
                    {order.botaneOrderRef}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.disabled">
                    Não enviado
                  </Typography>
                )}
              </DefRow>
              <DefRow label="Status">
                <OrderStatusChip status={order.status} />
              </DefRow>
            </SectionCard>

            {/* Dados fiscais — em aberto */}
            <SectionCard title="Dados fiscais" icon={ReceiptRoundedIcon}>
              <Box
                sx={{
                  display: "inline-block",
                  px: 1,
                  py: 0.25,
                  mb: 1,
                  borderRadius: 1,
                  bgcolor: "var(--color-warning-light)",
                  color: "#92610A",
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                Decisão fiscal em aberto (§9.3)
              </Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Responsável fiscal pela venda (NAWA, Botane ou nota dividida) ainda não
                definido. Emissão via eNotas depende dessa decisão.
              </Typography>
            </SectionCard>
          </Stack>
        </Grid>
      </Grid>

      <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 3 }}>
        Última atualização em {formatDate(order.createdAt)}
      </Typography>
    </Box>
  );
}
