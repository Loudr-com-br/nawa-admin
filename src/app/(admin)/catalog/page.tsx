import {
  listPlans,
  listProducts,
  listJourneyOptions,
  listRefOptions,
} from "@/lib/catalog/queries";
import CatalogClient from "./CatalogClient";

export default async function CatalogPage() {
  const [plans, products, journeys, refOptions] = await Promise.all([
    listPlans(),
    listProducts(),
    listJourneyOptions(),
    listRefOptions(),
  ]);
  return (
    <CatalogClient
      plans={plans}
      products={products}
      journeys={journeys}
      refOptions={refOptions}
    />
  );
}
