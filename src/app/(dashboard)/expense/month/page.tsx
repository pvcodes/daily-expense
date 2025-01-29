import { getMonthlyExpenses, getDistinctMidsWithTotalSpend } from "@/db/actions/expense"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDateInMMYYYY } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import Link from "next/link"
import { Wallet } from "lucide-react"
import { format } from "date-fns"
import { AddMonthlyExpenseForm } from "@/components/expense/month"

export default async function ExpensePage() {
    const userId = (await getServerSession(authOptions))?.user.id as number
    const currMonthStr = getDateInMMYYYY(new Date())
    const mids = await getDistinctMidsWithTotalSpend(userId);
    const { totalSpend } = await getMonthlyExpenses(currMonthStr, userId);

    return (
        <div className="p-4 flex flex-col">
            <Card className="my-2 shadow-md border-0 bg-gradient-to-br from-blue-50 to-purple-50">
                <CardHeader className="flex items-center gap-2 text-indigo-600">
                    <Wallet className="h-6 w-6 text-blue-500" />
                    <span className="text-lg font-semibold">Monthly Expense</span>
                </CardHeader>
                <CardContent className="text-center">
                    {
                        totalSpend <= 0 ? <AddMonthlyExpenseForm /> :
                            <div className="text-4xl font-extrabold text-indigo-900">₹{totalSpend}</div>
                    }
                    <div className="text-sm text-muted-foreground mt-1">Spent in {format(new Date(), 'MMMM yyyy')}</div>
                </CardContent>
            </Card>
            <ExpenseHistory mids={mids} />
        </div>
    )
}

function ExpenseHistory({ mids }: { mids: Array<{ mid: string; totalSpend: number }> }) {
    if (!mids?.length) {
        return (
            <div className="text-center py-8 text-muted-foreground bg-muted/50 rounded-lg">
                Start tracking your expenses!
            </div>
        )
    }

    return (
        <Card>
            <CardContent className="bg-muted/50 p-0">
                <div className="grid grid-cols-2 p-3 text-sm font-medium text-muted-foreground">
                    <div>Month</div>
                    <div className="text-right">Total Spent</div>
                </div>
                <div className="divide-y divide-border">
                    {mids.map(({ mid, totalSpend }) => (
                        <Link
                            key={mid}
                            href={`/expense/month/${mid}`}
                            className="block hover:bg-purple-100 transition-colors"
                        >
                            <div className="grid grid-cols-2 p-3 items-center">
                                <div className="text-sm font-medium text-indigo-800">{mid}</div>
                                <div className="text-right text-sm font-semibold text-indigo-600">
                                    {totalSpend > 0 ? `₹${totalSpend}` : 'N/A'}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
