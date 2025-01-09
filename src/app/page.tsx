import Dashboard from "@/components/Dashboard";
import LandingPage from "@/components/ui/LandingPage";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions)

  return (
    <div className="mt-2">
      {session?.user ? <Dashboard /> : <LandingPage />}
    </div>
  );
}
