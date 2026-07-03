export interface AuditEntry {
  id: string;
  actorEmail: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  changes: Record<string, unknown>;
  ip: string | null;
  createdAt: string;
}

export const actionLabels: Record<string, string> = {
  "user.invite": "Convidou usuário",
  "user.role_change": "Alterou papel",
  "user.status_change": "Alterou status de usuário",
  "api_key.create": "Criou chave de API",
  "api_key.revoke": "Revogou chave",
  "api_key.rotate": "Rotacionou chave",
  "subscription.status_change": "Alterou status de assinatura",
  "subscription.plan_change": "Trocou plano de assinatura",
};
