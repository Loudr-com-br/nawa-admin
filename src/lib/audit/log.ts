import "server-only";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

export interface AuditOptions {
  entityType?: string;
  entityId?: string | null;
  changes?: Record<string, unknown>;
}

/**
 * Registra uma ação sensível em audit_log (§8.3). Best-effort: uma falha de
 * auditoria nunca quebra a operação principal. Registro imutável (sem update/delete).
 */
export async function logAudit(action: string, opts: AuditOptions = {}): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: internal } = await supabase
      .from("users_internal")
      .select("email")
      .eq("id", user.id)
      .maybeSingle();

    let ip: string | null = null;
    try {
      const hdrs = await headers();
      ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    } catch {
      ip = null;
    }

    await supabase.from("audit_log").insert({
      actor_id: user.id,
      actor_email: internal?.email ?? user.email ?? null,
      action,
      entity_type: opts.entityType ?? null,
      entity_id: opts.entityId ?? null,
      changes: (opts.changes ?? {}) as Json,
      ip,
    });
  } catch {
    // silencioso — auditoria é best-effort
  }
}
