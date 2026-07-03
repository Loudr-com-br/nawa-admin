"use client";

import { useEffect } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import SettingsSuggestRoundedIcon from "@mui/icons-material/SettingsSuggestRounded";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Fronteira de erro do grupo (admin). Substitui a tela branca de exceção por
 * uma mensagem amigável dentro do shell. Distingue "backend não configurado"
 * (envs do Supabase faltando) de um erro genérico (com retry).
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const notConfigured = !isSupabaseConfigured;

  return (
    <Box sx={{ maxWidth: 640 }}>
      <Card>
        <CardContent sx={{ py: 5 }}>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            {notConfigured ? (
              <SettingsSuggestRoundedIcon color="warning" />
            ) : (
              <ErrorOutlineRoundedIcon color="error" />
            )}
            <Box sx={{ flex: 1 }}>
              {notConfigured ? (
                <>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Backend não configurado
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    As variáveis de ambiente do Supabase não estão definidas. Configure
                    <code> NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
                    <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> e{" "}
                    <code>SUPABASE_SERVICE_ROLE_KEY</code> no ambiente e recarregue.
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Algo deu errado
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Não foi possível carregar esta tela. Tente novamente; se persistir,
                    verifique a conexão com o banco.
                  </Typography>
                  {error.digest && (
                    <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 1 }}>
                      Ref: {error.digest}
                    </Typography>
                  )}
                  <Button variant="contained" size="small" onClick={reset} sx={{ mt: 2 }}>
                    Tentar novamente
                  </Button>
                </>
              )}
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
