import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";

// Agenda de endereços do paciente (spec §6.3). TODAS as funções recebem o
// `patientId` já resolvido pelo JWT no servidor — nenhuma aceita o dono como
// parâmetro vindo do cliente, então não há como ler ou apagar endereço alheio.

export interface PatientAddress {
  id: string;
  label: string | null;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string | null;
  cidade: string;
  uf: string;
  isDefault: boolean;
}

export interface AddressInput {
  label?: string | null;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string | null;
  bairro?: string | null;
  cidade: string;
  uf: string;
  isDefault?: boolean;
}

function toRow(a: any): PatientAddress {
  return {
    id: a.id,
    label: a.label,
    cep: a.cep,
    logradouro: a.logradouro,
    numero: a.numero,
    complemento: a.complemento,
    bairro: a.bairro,
    cidade: a.cidade,
    uf: a.uf,
    isDefault: a.is_default,
  };
}

const digits = (v: string) => v.replace(/\D/g, "");

/** Valida o mínimo para o endereço servir a frete e cobrança. */
export function validateAddress(input: Partial<AddressInput>): string | null {
  if (digits(input.cep ?? "").length !== 8) return "cep_invalido";
  if (!input.logradouro?.trim()) return "logradouro_obrigatorio";
  if (!input.numero?.trim()) return "numero_obrigatorio";
  if (!input.cidade?.trim()) return "cidade_obrigatoria";
  if ((input.uf ?? "").trim().length !== 2) return "uf_invalida";
  return null;
}

export async function listAddresses(patientId: string): Promise<PatientAddress[]> {
  const sb: any = createAdminClient();
  const { data } = await sb
    .from("patient_addresses")
    .select("*")
    .eq("patient_id", patientId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });
  return (data ?? []).map(toRow);
}

/**
 * O índice parcial do banco garante um só padrão por paciente — então limpar o
 * anterior é obrigatório, não cosmético: sem isso o insert violaria a unique.
 */
async function clearDefault(sb: any, patientId: string, exceptId?: string) {
  let q = sb.from("patient_addresses").update({ is_default: false })
    .eq("patient_id", patientId).eq("is_default", true);
  if (exceptId) q = q.neq("id", exceptId);
  await q;
}

export async function createAddress(
  patientId: string,
  input: AddressInput,
): Promise<PatientAddress | { error: string }> {
  const invalid = validateAddress(input);
  if (invalid) return { error: invalid };

  const sb: any = createAdminClient();
  const existing = await listAddresses(patientId);
  // O primeiro endereço vira padrão sozinho — poupa o paciente de um passo.
  const isDefault = input.isDefault || existing.length === 0;
  if (isDefault) await clearDefault(sb, patientId);

  const { data, error } = await sb
    .from("patient_addresses")
    .insert({
      patient_id: patientId,
      label: input.label ?? null,
      cep: digits(input.cep),
      logradouro: input.logradouro.trim(),
      numero: input.numero.trim(),
      complemento: input.complemento ?? null,
      bairro: input.bairro ?? null,
      cidade: input.cidade.trim(),
      uf: input.uf.trim().toUpperCase(),
      is_default: isDefault,
    })
    .select("*")
    .single();
  if (error || !data) return { error: error?.message ?? "insert_failed" };
  return toRow(data);
}

export async function updateAddress(
  patientId: string,
  addressId: string,
  input: Partial<AddressInput>,
): Promise<PatientAddress | { error: string }> {
  const sb: any = createAdminClient();
  const { data: current } = await sb
    .from("patient_addresses")
    .select("*")
    .eq("id", addressId)
    .eq("patient_id", patientId) // escopo: só o dono altera
    .maybeSingle();
  if (!current) return { error: "not_found" };

  const merged = { ...toRow(current), ...input };
  const invalid = validateAddress(merged);
  if (invalid) return { error: invalid };

  if (input.isDefault) await clearDefault(sb, patientId, addressId);

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.label !== undefined) patch.label = input.label;
  if (input.cep !== undefined) patch.cep = digits(input.cep);
  if (input.logradouro !== undefined) patch.logradouro = input.logradouro.trim();
  if (input.numero !== undefined) patch.numero = input.numero.trim();
  if (input.complemento !== undefined) patch.complemento = input.complemento;
  if (input.bairro !== undefined) patch.bairro = input.bairro;
  if (input.cidade !== undefined) patch.cidade = input.cidade.trim();
  if (input.uf !== undefined) patch.uf = input.uf.trim().toUpperCase();
  if (input.isDefault !== undefined) patch.is_default = input.isDefault;

  const { data, error } = await sb
    .from("patient_addresses")
    .update(patch)
    .eq("id", addressId)
    .eq("patient_id", patientId)
    .select("*")
    .single();
  if (error || !data) return { error: error?.message ?? "update_failed" };
  return toRow(data);
}

/**
 * Apagar não afeta pedidos: eles guardam um snapshot do endereço (ver a migration).
 * Se o apagado era o padrão, o mais antigo restante assume — o paciente não deve
 * ficar sem padrão por ter limpado a agenda.
 */
export async function deleteAddress(
  patientId: string,
  addressId: string,
): Promise<{ ok: true } | { error: string }> {
  const sb: any = createAdminClient();
  const { data: current } = await sb
    .from("patient_addresses")
    .select("id, is_default")
    .eq("id", addressId)
    .eq("patient_id", patientId)
    .maybeSingle();
  if (!current) return { error: "not_found" };

  await sb.from("patient_addresses").delete().eq("id", addressId).eq("patient_id", patientId);

  if (current.is_default) {
    const rest = await listAddresses(patientId);
    if (rest.length) {
      await sb.from("patient_addresses").update({ is_default: true }).eq("id", rest[0].id);
    }
  }
  return { ok: true };
}

/** Endereço para uso no checkout: o escolhido, ou o padrão. */
export async function getAddressForOrder(
  patientId: string,
  addressId?: string,
): Promise<PatientAddress | null> {
  const all = await listAddresses(patientId);
  if (!all.length) return null;
  if (addressId) return all.find((a) => a.id === addressId) ?? null;
  return all.find((a) => a.isDefault) ?? all[0];
}
