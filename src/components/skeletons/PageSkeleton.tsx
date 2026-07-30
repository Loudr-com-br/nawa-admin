import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Skeleton from "@mui/material/Skeleton";
import Grid from "@mui/material/Grid2";

/**
 * Skeletons de rota (App Router `loading.tsx`). Dão feedback imediato na
 * navegação: o clique mostra a estrutura da tela na hora, via Suspense, enquanto
 * o Server Component busca os dados. Sem isto, a transição fica "pendurada" na
 * tela anterior até o fetch terminar (sensação de clique lento).
 *
 * Renderizados dentro do `<main>` do AdminShell (já com padding), então o shell
 * — sidebar e topbar — permanece visível e só a área de conteúdo troca.
 */

/** Cabeçalho padrão das telas: título (h4) + subtítulo. */
function PageHeader() {
  return (
    <Box sx={{ mb: 3 }}>
      <Skeleton variant="text" width={200} sx={{ fontSize: "2rem", mb: 0.5 }} />
      <Skeleton variant="text" width={380} sx={{ fontSize: "1rem" }} />
    </Box>
  );
}

/** Lista: cabeçalho + card com barra de filtros e linhas de tabela. */
export function ListPageSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <Box>
      <PageHeader />
      <Card>
        {/* barra de filtros */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}
        >
          <Skeleton variant="rounded" height={40} sx={{ flex: 1, minWidth: 240 }} />
          <Skeleton variant="rounded" width={180} height={40} />
          <Skeleton variant="rounded" width={180} height={40} />
        </Stack>
        {/* linhas */}
        <Box sx={{ p: 2 }}>
          {Array.from({ length: rows }).map((_, i) => (
            <Stack
              key={i}
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{ py: 1.25 }}
            >
              <Skeleton variant="circular" width={30} height={30} />
              <Skeleton variant="text" sx={{ flex: 1 }} />
              <Skeleton variant="text" width="15%" />
              <Skeleton variant="rounded" width={80} height={22} />
              <Skeleton variant="text" width="10%" />
            </Stack>
          ))}
        </Box>
      </Card>
    </Box>
  );
}

/** Detalhe: voltar + título + grade de cards de seção. */
export function DetailPageSkeleton() {
  return (
    <Box>
      <Skeleton variant="text" width={80} sx={{ mb: 2 }} />
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Skeleton variant="text" width={260} sx={{ fontSize: "2rem" }} />
        <Skeleton variant="rounded" width={90} height={24} />
      </Stack>
      <Grid container spacing={3}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Grid key={i} size={{ xs: 12, md: 6 }}>
            <Card sx={{ p: 3 }}>
              <Skeleton variant="text" width={140} sx={{ mb: 2 }} />
              {Array.from({ length: 4 }).map((__, j) => (
                <Stack
                  key={j}
                  direction="row"
                  justifyContent="space-between"
                  sx={{ py: 0.75 }}
                >
                  <Skeleton variant="text" width="35%" />
                  <Skeleton variant="text" width="45%" />
                </Stack>
              ))}
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

/** Dashboard: cabeçalho + linha de KPIs + cards de gráfico. */
export function DashboardSkeleton() {
  return (
    <Box>
      <PageHeader />
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ p: 3 }}>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" sx={{ fontSize: "2rem", my: 1 }} />
              <Skeleton variant="text" width="30%" />
            </Card>
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={3}>
        {Array.from({ length: 2 }).map((_, i) => (
          <Grid key={i} size={{ xs: 12, md: 6 }}>
            <Card sx={{ p: 3 }}>
              <Skeleton variant="text" width={160} sx={{ mb: 2 }} />
              <Skeleton variant="rounded" height={240} />
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
