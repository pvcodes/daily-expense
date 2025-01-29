import { getBudgetsInPagination, getTotalSpendInMonth } from "@/db/actions/expense"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { compareDate, getDateInMMYYYY } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { TypographyH3, TypographyMuted } from "@/components/Typography"
import { Clock4Icon, Wallet } from "lucide-react"
import { format } from "date-fns"
import { BudgetDisplay, BudgetTable } from "@/components/expense"
import { AddBudgetForm } from "@/components/expense/AddBudgetForm"
import Link from "next/link"
import { AddMonthlyExpenseForm } from "@/components/expense/month"

export default async function ExpensePage() {
    const userId = (await getServerSession(authOptions))?.user.id as number
    const { budgets } = await getBudgetsInPagination(1, 10, userId)
    const currMonthStr = getDateInMMYYYY(new Date())
    const { totalSpend: totalSpendInMonth } = await getTotalSpendInMonth(currMonthStr, userId)
    const todayBudget = budgets[0]?.day && compareDate(budgets[0].day, new Date()) ? budgets[0] : null

    return (
        <div className="m-4">
            <div className="flex flex-col justify-between lg:flex-row md:flex-row">
                <Card className="mb-2 min-w-80 bg-gradient-to-br from-blue-50 to-purple-50">
                    <CardHeader>
                        <TypographyH3 className="flex items-center gap-2">
                            <Wallet className="h-6 w-6 text-blue-500" />
                            Today&apos;s Budget
                        </TypographyH3>
                        <TypographyMuted>
                            {format(new Date(), 'EEEE, MMM dd')}
                        </TypographyMuted>
                    </CardHeader>
                    <CardContent>
                        {todayBudget ? (
                            <BudgetDisplay amount={todayBudget.amount} desc='Today&apos;s Budget' />
                        ) : (
                            <AddBudgetForm />
                        )}
                    </CardContent>
                </Card>

                <Card className="mb-2 min-w-80 bg-gradient-to-br from-blue-50 to-purple-50">
                    <CardHeader>
                        <TypographyH3 className="flex items-center gap-2">
                            <Clock4Icon className="h-6 w-6 text-blue-500" />
                            Monthly Expense
                        </TypographyH3>
                        <TypographyMuted>
                            {format(new Date(), 'MMMM yyyy')}
                        </TypographyMuted>
                    </CardHeader>
                    <CardContent className="flex flex-col justify-end">

                        {

                            totalSpendInMonth <= 0 ?
                                <AddMonthlyExpenseForm showDialog /> :
                                <BudgetDisplay amount={totalSpendInMonth} desc='Total Spend' />
                        }
                        <Link href='/expense/month' className="pt-0.5 flex justify-end">
                            <TypographyMuted className="text-blue-900 underline">view all monthly expense</TypographyMuted>
                        </Link>
                    </CardContent>
                </Card>

            </div>

            <BudgetTable budgets={budgets} />

        </div>
    )
}
