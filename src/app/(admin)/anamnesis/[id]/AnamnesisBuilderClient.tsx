"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Alert from "@mui/material/Alert";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import AltRouteRoundedIcon from "@mui/icons-material/AltRouteRounded";
import PublishStatusChip from "@/components/PublishStatusChip";
import {
  questionTypes,
  questionTypeLabels,
  typesWithOptions,
  type AnamnesisFormDetail,
  type Question,
  type QuestionType,
} from "@/lib/anamnesis/types";
import { saveForm, saveQuestion, deleteQuestion, reorderQuestions } from "../actions";

const emptyQuestion = {
  label: "",
  type: "text" as QuestionType,
  required: false,
  riskWeight: "0",
  options: "",
  dependsOn: "",
  equals: "",
};

export default function AnamnesisBuilderClient({ form }: { form: AnamnesisFormDetail }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [questions, setQuestions] = useState<Question[]>(form.questions);

  // Sincroniza com o servidor após refresh.
  useEffect(() => { setQuestions(form.questions); }, [form.questions]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [q, setQ] = useState(emptyQuestion);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const totalRisk = questions.reduce((s, x) => s + x.riskWeight, 0);

  async function togglePublish() {
    setBusy(true);
    await saveForm(form.id, {
      name: form.name, slug: form.slug,
      status: form.status === "published" ? "draft" : "published",
    });
    setBusy(false);
    router.refresh();
  }

  function openNew() {
    setEditing(null);
    setQ(emptyQuestion);
    setError(null); setConfirmDelete(false);
    setOpen(true);
  }

  function openEdit(question: Question) {
    setEditing(question);
    setQ({
      label: question.label,
      type: question.type,
      required: question.required,
      riskWeight: String(question.riskWeight),
      options: question.options.join("\n"),
      dependsOn: question.conditional?.dependsOn ?? "",
      equals: question.conditional?.equals !== undefined ? String(question.conditional.equals) : "",
    });
    setError(null); setConfirmDelete(false);
    setOpen(true);
  }

  async function handleSave() {
    setError(null);
    if (!q.label.trim()) { setError("Preencha o enunciado."); return; }
    const conditional = q.dependsOn ? { dependsOn: q.dependsOn, equals: q.equals } : {};
    setBusy(true);
    const result = await saveQuestion(editing?.id ?? null, {
      formId: form.id,
      order: editing?.order ?? questions.length,
      type: q.type,
      label: q.label,
      required: q.required,
      riskWeight: Number(q.riskWeight) || 0,
      options: typesWithOptions.includes(q.type)
        ? q.options.split("\n").map((s) => s.trim()).filter(Boolean)
        : [],
      conditional,
    });
    setBusy(false);
    if (!result.ok) { setError(result.error); return; }
    setOpen(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!editing) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setBusy(true);
    const result = await deleteQuestion(editing.id, form.id);
    setBusy(false);
    if (!result.ok) { setError(result.error); return; }
    setOpen(false);
    router.refresh();
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= questions.length) return;
    const next = [...questions];
    [next[index], next[target]] = [next[target], next[index]];
    setQuestions(next); // otimista
    setBusy(true);
    await reorderQuestions(form.id, next.map((x) => x.id));
    setBusy(false);
    router.refresh();
  }

  const questionLabelById = (id: string) => questions.find((x) => x.id === id)?.label ?? "pergunta";

  return (
    <Box sx={{ maxWidth: 900 }}>
      <Button component={Link} href="/anamnesis" startIcon={<ArrowBackRoundedIcon />} sx={{ mb: 2, color: "text.secondary" }} size="small">
        Anamnese
      </Button>

      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="h4" component="h1">{form.name}</Typography>
            <PublishStatusChip status={form.status} />
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {questions.length} {questions.length === 1 ? "pergunta" : "perguntas"}
            </Typography>
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: "text.secondary" }}>
              <BoltRoundedIcon sx={{ fontSize: 16 }} />
              <Typography variant="body2">Risco máximo: {totalRisk}</Typography>
            </Stack>
          </Stack>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant={form.status === "published" ? "outlined" : "contained"} onClick={togglePublish} disabled={busy}>
            {form.status === "published" ? "Despublicar" : "Publicar"}
          </Button>
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openNew}>Adicionar</Button>
        </Stack>
      </Stack>

      {questions.length === 0 ? (
        <Card sx={{ p: 5, textAlign: "center", color: "text.secondary" }}>
          <Typography variant="body2">Nenhuma pergunta ainda. Adicione a primeira.</Typography>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {questions.map((question, index) => (
            <Card key={question.id} sx={{ p: 2, cursor: "pointer", "&:hover": { borderColor: "primary.light" } }} onClick={() => openEdit(question)}>
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box sx={{ width: 26, height: 26, borderRadius: "50%", bgcolor: "var(--color-blue-50)", color: "primary.main", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, flexShrink: 0, mt: 0.25 }}>
                  {index + 1}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{question.label}</Typography>
                  <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" sx={{ mt: 0.75, gap: 0.75 }}>
                    <Chip label={questionTypeLabels[question.type]} size="small" variant="outlined" />
                    {question.required && <Chip label="Obrigatória" size="small" variant="outlined" />}
                    {question.riskWeight > 0 && (
                      <Chip icon={<BoltRoundedIcon />} label={`Risco ${question.riskWeight}`} size="small" variant="outlined" />
                    )}
                    {question.conditional?.dependsOn && (
                      <Chip icon={<AltRouteRoundedIcon />} label={`Condicional: ${questionLabelById(question.conditional.dependsOn)}`} size="small" variant="outlined" sx={{ maxWidth: 260 }} />
                    )}
                  </Stack>
                  {question.options.length > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                      Opções: {question.options.join(" · ")}
                    </Typography>
                  )}
                </Box>
                <Stack onClick={(e) => e.stopPropagation()}>
                  <IconButton size="small" disabled={index === 0 || busy} onClick={() => move(index, -1)}><KeyboardArrowUpRoundedIcon fontSize="small" /></IconButton>
                  <IconButton size="small" disabled={index === questions.length - 1 || busy} onClick={() => move(index, 1)}><KeyboardArrowDownRoundedIcon fontSize="small" /></IconButton>
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}

      {/* Diálogo de pergunta */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 600 }}>{editing ? "Editar pergunta" : "Nova pergunta"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField label="Enunciado" value={q.label} onChange={(e) => setQ({ ...q, label: e.target.value })} placeholder="Qual a sua idade?" autoFocus />
            <Stack direction="row" spacing={2}>
              <TextField select label="Tipo" value={q.type} onChange={(e) => setQ({ ...q, type: e.target.value as QuestionType })} fullWidth>
                {questionTypes.map((t) => <MenuItem key={t} value={t}>{questionTypeLabels[t]}</MenuItem>)}
              </TextField>
              <TextField label="Peso de risco" type="number" value={q.riskWeight} onChange={(e) => setQ({ ...q, riskWeight: e.target.value })} sx={{ width: 160 }} />
            </Stack>
            {typesWithOptions.includes(q.type) && (
              <TextField label="Opções" value={q.options} onChange={(e) => setQ({ ...q, options: e.target.value })} multiline rows={3} placeholder={"Sedentário\nLeve\nModerado\nIntenso"} helperText="Uma opção por linha." />
            )}
            <FormControlLabel control={<Switch checked={q.required} onChange={(e) => setQ({ ...q, required: e.target.checked })} />} label={<Typography variant="body2">Obrigatória</Typography>} />

            {/* Condicional */}
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: "background.default" }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Condição (opcional)</Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                <TextField select label="Exibir se" value={q.dependsOn} onChange={(e) => setQ({ ...q, dependsOn: e.target.value })} fullWidth size="small">
                  <MenuItem value="">Sempre exibir</MenuItem>
                  {questions.filter((x) => x.id !== editing?.id).map((x) => <MenuItem key={x.id} value={x.id}>{x.label}</MenuItem>)}
                </TextField>
                {q.dependsOn && (
                  <TextField label="For igual a" value={q.equals} onChange={(e) => setQ({ ...q, equals: e.target.value })} size="small" sx={{ width: 180 }} placeholder="true" />
                )}
              </Stack>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
          <Box>{editing && <Button color="error" onClick={handleDelete} disabled={busy}>{confirmDelete ? "Confirmar exclusão" : "Excluir"}</Button>}</Box>
          <Stack direction="row" spacing={1}>
            <Button onClick={() => setOpen(false)} color="inherit" disabled={busy}>Cancelar</Button>
            <Button variant="contained" onClick={handleSave} disabled={busy}>{busy ? "Salvando…" : "Salvar"}</Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
