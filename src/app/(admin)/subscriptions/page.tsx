import { listSubscriptions, listPlanOptions } from "@/lib/subscriptions/queries";
import SubscriptionsClient from "./SubscriptionsClient";

export default async function SubscriptionsPage() {
  const [subscriptions, planOptions] = await Promise.all([
    listSubscriptions(),
    listPlanOptions(),
  ]);
  return <SubscriptionsClient subscriptions={subscriptions} planOptions={planOptions} />;
}
