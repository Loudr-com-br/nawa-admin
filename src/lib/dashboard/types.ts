import type { OrderStatus, PaymentStatus } from "@/lib/orders/types";

export interface DashOrderItem {
  name: string;
  unitPrice: number;
  quantity: number;
  isGlp1: boolean;
}

export interface DashOrder {
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  items: DashOrderItem[];
}

export interface DashboardData {
  orders: DashOrder[];
  activeSubscriptions: number;
  patientCount: number;
}

export type Period = "today" | "7d" | "30d" | "60d";

export const periodLabels: Record<Period, string> = {
  today: "Hoje",
  "7d": "7 dias",
  "30d": "30 dias",
  "60d": "60 dias",
};

export const periodDays: Record<Period, number> = { today: 1, "7d": 7, "30d": 30, "60d": 60 };
