import { redirect } from "next/navigation";

export default function Home() {
  // O login/landing entra aqui depois (Supabase Auth). Por ora, vai ao dashboard.
  redirect("/dashboard");
}
