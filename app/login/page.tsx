import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginForm from "@/app/login/login-form";

export const runtime = "nodejs";

export default async function LoginPage() {
  if (await getSession()) redirect("/");
  return <LoginForm />;
}
