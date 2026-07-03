import type { ContentStatus } from "@/lib/catalog/types";

export interface JourneyContent {
  tagline: string;
  description: string;
  highlights: string[];
}

export interface Journey {
  id: string;
  slug: string;
  name: string;
  status: ContentStatus;
  planCount: number;
  createdAt: string;
}

export interface JourneyPlan {
  id: string;
  name: string;
  basePrice: number;
  billingInterval: string;
  status: ContentStatus;
}

export interface JourneyDetail extends Journey {
  content: JourneyContent;
  plans: JourneyPlan[];
}

/** Plano disponível para vincular (mostra se já pertence a outra jornada). */
export interface PlanOption {
  id: string;
  name: string;
  journeyId: string | null;
}

export function emptyContent(): JourneyContent {
  return { tagline: "", description: "", highlights: [] };
}
