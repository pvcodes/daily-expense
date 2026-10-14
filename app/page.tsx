import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Dashboard from "@/app/dashboard";

export const runtime = "nodejs";

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <Dashboard />;
}
