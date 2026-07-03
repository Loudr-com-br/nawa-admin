export type SubscriptionStatus = "active" | "paused" | "canceled" | "past_due";

export interface Subscription {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  paymentProviderRef: string | null;
  createdAt: string;
}

export const subStatusConfig: Record<
  SubscriptionStatus,
  { label: string; dot: string }
> = {
  active: { label: "Ativa", dot: "#22C55E" },
  paused: { label: "Pausada", dot: "#F59E0B" },
  past_due: { label: "Inadimplente", dot: "#EF4444" },
  canceled: { label: "Cancelada", dot: "#94A3B8" },
};

export const subStatusOrder: SubscriptionStatus[] = [
  "active",
  "paused",
  "past_due",
  "canceled",
];
