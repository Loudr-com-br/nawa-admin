import { listPromotions } from "@/lib/promotions/queries";
import PromotionsClient from "./PromotionsClient";

export default async function PromotionsPage() {
  const promotions = await listPromotions();
  return <PromotionsClient promotions={promotions} />;
}
