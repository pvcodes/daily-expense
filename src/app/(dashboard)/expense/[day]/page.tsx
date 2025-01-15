import AddExpenseForm from "@/components/expense/AddExpenseForm";
import { TypographyMuted } from "@/components/Typography";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getExpenseInPagination } from "@/db/actions/expense";
import { authOptions } from "@/lib/auth";
import { Expense } from "@/types/expense";
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { getServerSession } from "next-auth";



export default async function SingleExpensePage({ params }: {
    params: Promise<{ day: string }>
}) {
    const { day } = await params
    const session = await getServerSession(authOptions)
    const { expenses, budget } = await getExpenseInPagination(1, 10, day, session?.user.id as number)

    if (!expenses || !budget) {
        return <>
            Not a Valid day, {day}!
        </>
    }

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Daily Expenses</h1>
                    <div className="flex items-center text-gray-500 mt-1">
                        <Calendar className="w-4 h-4 mr-2" />
                        {format(new Date(budget.day), 'MMMM d, yyyy')}
                    </div>
                </div>
                <BudgetCard remaining={budget.remaining} />
            </div>
            <AddExpenseForm budgetId={budget.id} />

            <ExpensesList
                expenses={expenses}
                totalExpended={budget.amount - budget.remaining}
            />
        </div>
    )
}




// Helper Components
const BudgetCard = ({ remaining }: { remaining: number }) => (
    <Card className="bg-green-50 border-green-100">
        <CardContent className="p-4">
            <div className="text-sm text-gray-600">Budget Left</div>
            <div className="text-2xl font-bold text-green-700">
                {remaining < 0 ? 'Overspent' : `₹${remaining.toFixed(2)}`}
            </div>
        </CardContent>
    </Card>
)

const ExpensesList = ({ expenses, totalExpended }: { expenses: Expense[], totalExpended: number }) => (
    <Card>
        <CardHeader className='flex flex-row justify-between'>
            <CardTitle className="text-lg">Today&apos;s Expenses</CardTitle>
            <TypographyMuted>
                Total Expended: <span>₹{totalExpended}</span>
            </TypographyMuted>
        </CardHeader>
        <CardContent>
            {/* TODO: Update and delete expenses */}
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
                            </div>
                            <div className="text-right font-semibold">
                                ₹{Number(expense.amount)}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </CardContent>
    </Card>
)