import { getBudgetsInPagination } from "@/db/actions/expense"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { compareDate } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { TypographyH3 } from "@/components/Typography"
import { Wallet } from "lucide-react"
import { format } from "date-fns"
import { BudgetDisplay, BudgetTable } from "@/components/expense"
import { AddBudgetForm } from "@/components/expense/AddBudgetForm"

export default async function ExpensePage() {
    const session = await getServerSession(authOptions)
    const { budgets } = await getBudgetsInPagination(1, 10, session?.user.id as number)
    const todayBudget = budgets[0]?.day && compareDate(budgets[0].day, new Date()) ? budgets[0] : null

    return (
        <div className="p-4">
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <TypographyH3 className="flex items-center gap-2">
                                <Wallet className="h-6 w-6 text-blue-500" />
                                Plan Today&apos;s Spending
                            </TypographyH3>
                            <span className="text-sm text-gray-500">
                                {format(new Date(), 'EEEE, MMM dd')}
                            </span>
                        </div>

                        {todayBudget ? (
                            <BudgetDisplay amount={todayBudget.amount} />
                        ) : (
                            <AddBudgetForm />
                        )}
                    </div>
                </CardContent>
            </Card>
            <BudgetTable budgets={budgets} />

        </div>
    )
}
