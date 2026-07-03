import type { Subscription } from "@/lib/subscriptions/types";
import type { OrderStatus } from "@/lib/orders/types";

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  consentStatus: string;
  createdAt: string;
}

export interface PatientOrder {
  id: string;
  number: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
}

export interface PatientDetail extends Patient {
  clinicalProfile: Record<string, unknown>;
  subscriptions: Subscription[];
  orders: PatientOrder[];
}

export const consentLabels: Record<string, string> = {
  granted: "Consentido",
  pending: "Pendente",
  revoked: "Revogado",
};
