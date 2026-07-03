import { listOrders } from "@/lib/orders/queries";
import OrdersClient from "./OrdersClient";

export default async function OrdersPage() {
  const orders = await listOrders();
  return <OrdersClient orders={orders} />;
}
