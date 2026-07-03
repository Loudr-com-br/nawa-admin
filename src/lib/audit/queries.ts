import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AuditEntry } from "./types";

export type { AuditEntry } from "./types";
export { actionLabels } from "./types";

export async function listAuditLog(limit = 300): Promise<AuditEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("id, actor_email, action, entity_type, entity_id, changes, ip, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`listAuditLog: ${error.message}`);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return (data ?? []).map((r: any) => ({
    id: r.id,
    actorEmail: r.actor_email ?? "—",
    action: r.action,
    entityType: r.entity_type,
    entityId: r.entity_id,
    changes: (r.changes ?? {}) as Record<string, unknown>,
    ip: r.ip,
    createdAt: r.created_at,
  }));
}
