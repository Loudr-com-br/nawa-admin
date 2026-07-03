"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Link from "@mui/material/Link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("E-mail ou senha inválidos.");
      return;
    }
    router.replace(redirectTo);
    router.refresh();
  }

  async function handleForgot() {
    setError(null);
    setNotice(null);
    if (!email) {
      setError("Informe seu e-mail para redefinir a senha.");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      setError("Não foi possível enviar o e-mail de redefinição.");
      return;
    }
    setNotice("Enviamos um link de redefinição para o seu e-mail.");
  }

  return (
    <Box sx={{ width: "100%", maxWidth: 380 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Olá!
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 700, color: "primary.main", mb: 4 }}>
        {greeting()}
      </Typography>

      <Typography variant="body1" sx={{ mb: 3 }}>
        <Box component="span" sx={{ color: "primary.main", fontWeight: 600 }}>
          Entrar
        </Box>{" "}
        na sua conta
      </Typography>

      {!isSupabaseConfigured && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Supabase ainda não configurado. Defina as variáveis em <code>.env.local</code>.
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <TextField
            variant="standard"
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <TextField
            variant="standard"
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
              }
              label={<Typography variant="body2">Lembrar de mim</Typography>}
            />
            <Link
              component="button"
              type="button"
              onClick={handleForgot}
              variant="body2"
              underline="hover"
              sx={{ color: "text.secondary" }}
            >
              Esqueci a senha
            </Link>
          </Stack>

          {error && <Alert severity="error">{error}</Alert>}
          {notice && <Alert severity="success">{notice}</Alert>}

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading || !isSupabaseConfigured}
            sx={{ py: 1.25, letterSpacing: "0.05em" }}
          >
            {loading ? "Entrando…" : "Entrar"}
          </Button>

          <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
            Acesso restrito à equipe interna da NAWA.
          </Typography>
        </Stack>
      </form>
    </Box>
  );
}

function BrandPanel() {
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        justifyContent: "space-between",
        p: 6,
        color: "common.white",
        background:
          "linear-gradient(160deg, #204FF1 0%, #0A28C0 55%, #0619AD 100%)",
      }}
    >
      {/* Estrelas sutis */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(1.5px 1.5px at 20% 25%, rgba(255,255,255,.7), transparent), radial-gradient(1.5px 1.5px at 70% 15%, rgba(255,255,255,.5), transparent), radial-gradient(1.5px 1.5px at 45% 40%, rgba(255,255,255,.45), transparent), radial-gradient(2px 2px at 82% 32%, rgba(255,255,255,.6), transparent), radial-gradient(1.5px 1.5px at 30% 55%, rgba(255,255,255,.4), transparent)",
        }}
      />
      {/* Nuvens/curvas na base — remete ao portal da marca */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          left: -80,
          right: -80,
          bottom: -120,
          height: 320,
          borderTopLeftRadius: "50%",
          borderTopRightRadius: "50%",
          background:
            "radial-gradient(120% 100% at 50% 100%, rgba(255,255,255,0.16), rgba(255,255,255,0) 70%)",
        }}
      />

      {/* Logo */}
      <Box sx={{ position: "relative" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo/nawa_logo_branco01.png" alt="NAWA" style={{ height: 26 }} />
      </Box>

      {/* Mensagem */}
      <Box sx={{ position: "relative" }}>
        <Typography variant="h3" sx={{ fontWeight: 700, letterSpacing: "-0.02em", mb: 1 }}>
          Backoffice
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.85, maxWidth: 340 }}>
          O cérebro da operação NAWA. Configure catálogo, protocolos e jornadas
          num só lugar.
        </Typography>
      </Box>

      {/* Rodapé */}
      <Typography variant="caption" sx={{ position: "relative", opacity: 0.7, letterSpacing: "0.1em" }}>
        NAWAHEALTH.COM
      </Typography>
    </Box>
  );
}

export default function LoginPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1.05fr 1fr" },
        bgcolor: "background.paper",
      }}
    >
      <BrandPanel />
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 3, sm: 6 },
        }}
      >
        <Suspense>
          <LoginForm />
        </Suspense>
      </Box>
    </Box>
  );
}
