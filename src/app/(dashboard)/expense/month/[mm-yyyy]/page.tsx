import { AddMonthlyExpenseForm } from "@/components/expense/month";
import { TypographyMuted } from "@/components/Typography";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMonthlyExpenses } from "@/db/actions/expense";
import { authOptions } from "@/lib/auth";
import { Expense } from "@/types/expense";
import { format, parse } from "date-fns";
import { Calendar } from "lucide-react";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

export default async function SingleExpensePage({ params }: {
    params: Promise<{ 'mm-yyyy': string }>
}) {
    const userId = (await getServerSession(authOptions))?.user.id as number
    const mid = (await params)?.["mm-yyyy"]

    if (!mid) notFound()

    const { monthlyExpenses, totalSpend } = await getMonthlyExpenses(mid, userId)
    const parsedDate = parse(mid, 'MM-yyyy', new Date())

    return (
        <div className="p-4 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Monthly Expenses</h1>
                    <div className="flex items-center text-gray-500 mt-1">
                        <Calendar className="w-4 h-4 mr-2" />
                        {format(parsedDate, 'MMMM yyyy')}
                    </div>
                </div>
                <MonthlySpendCard totalSpend={totalSpend} />
            </div>

            <AddMonthlyExpenseForm />

            <ExpensesList
                expenses={monthlyExpenses}
                totalExpended={totalSpend}
            />
        </div>
    )
}

// Helper Components
const MonthlySpendCard = ({ totalSpend }: { totalSpend: number }) => (
    <Card className="bg-green-50 border-green-100">
        <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total Spent</div>
            <div className="text-2xl font-bold text-green-700">
                ₹{totalSpend.toLocaleString()}
            </div>
        </CardContent>
    </Card>
)

const ExpensesList = ({ expenses, totalExpended }: { expenses: Expense[], totalExpended: number }) => (
    <Card>
        <CardHeader className='flex flex-row justify-between'>
            <CardTitle className="text-lg">Month&apos;s Expenses</CardTitle>
            <TypographyMuted>
                Total Expended: <span>₹{totalExpended.toLocaleString()}</span>
            </TypographyMuted>
        </CardHeader>
        <CardContent>
            <div className="space-y-3">
                {expenses.length === 0 ? (
                    <div className="text-center text-gray-500">No expense yet!</div>
                ) : (
                    expenses.map((expense) => (
                        <div
                            key={expense.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                            <div className="flex-1">
                                <div className="font-medium">{expense.description}</div>
                                <div className="text-sm text-gray-500">
                                    {format(new Date(expense.date), 'MMM d, yyyy')}
                                </div>
                            </div>
                            <div className="text-right font-semibold">
                                ₹{Number(expense.amount).toLocaleString()}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </CardContent>
    </Card>
)