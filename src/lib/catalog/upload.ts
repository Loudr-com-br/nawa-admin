"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

const BUCKET = "catalog";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Faz upload de uma imagem do catálogo para o bucket público `catalog` e
 * devolve a URL pública. A escrita usa o client admin (service role), então
 * bypassa a RLS de storage — mas só roda atrás da auth do backoffice (checa a
 * sessão antes). Ver migration 20260724120001_catalog_images.
 *
 * @param entity  "items" | "protocols" | "collections" (prefixo do caminho)
 */
export async function uploadCatalogImage(
  entity: string,
  formData: FormData,
): Promise<UploadResult> {
  // Guard: precisa de sessão do backoffice.
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: "Sessão expirada. Faça login novamente." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Selecione uma imagem." };
  }
  if (!ALLOWED.includes(file.type)) {
    return { ok: false, error: "Formato inválido. Use JPG, PNG, WebP ou AVIF." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Imagem acima de 5 MB." };
  }

  const safeEntity = ["items", "protocols", "collections"].includes(entity) ? entity : "misc";
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  // Nome único sem depender de Date/random (determinístico o suficiente): usa o
  // timestamp do próprio File quando disponível, senão o tamanho + nome.
  const stamp = (file as File).lastModified || file.size;
  const path = `${safeEntity}/${stamp}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}.${ext}`.replace(
    /\.(\w+)\.\1$/,
    ".$1",
  );

  const admin = createAdminClient();
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) return { ok: false, error: error.message };

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}
