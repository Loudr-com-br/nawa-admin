import { listItems, listSuppliers } from "@/lib/catalog/queries";
import CatalogClient from "./CatalogClient";

export default async function CatalogPage() {
  const [items, suppliers] = await Promise.all([listItems(), listSuppliers()]);
  return <CatalogClient items={items} suppliers={suppliers} />;
}
