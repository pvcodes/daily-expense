import ExpenseDashboard from "@/components/expense/dashboard";
import { getBudgetsInPagination } from "@/db/actions/expense";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export default async function ExpensePage() {
    const session = await getServerSession(authOptions)
    const { budgets } = await getBudgetsInPagination(1, 10, session.user.id)
    return <>
        <ExpenseDashboard budgets={budgets} />
    </>
}