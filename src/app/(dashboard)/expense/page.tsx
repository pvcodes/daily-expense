'use client'

import { useCallback, useMemo, useState } from "react"
import { TypographyH3 } from "@/components/Typography"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { IndianRupeeIcon, Wallet } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Budget } from "@/types/expense"
import { useBudgets, useExpenseActions } from "@/store/useExpenseStore"
import { expenseApi } from "@/service/expenseService"
import { dateToString } from "@/lib/utils"


// Components
const BudgetInput = ({
    onSubmit
}: {
    onSubmit: (amount: number) => void
}) => {
    const [amount, setAmount] = useState<number | ''>('')

    const handleSubmit = () => {
        if (!amount) return
        onSubmit(amount)
        setAmount('')
    }

    return (
        <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-xs group">
                <IndianRupeeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseInt(e.target.value))}
                    className="pl-10 h-12 text-lg transition-shadow focus:ring-2 ring-blue-100"
                    placeholder="0.00"
                />
            </div>
            <Button
                onClick={handleSubmit}
                disabled={!amount}
                className="h-12 px-6 bg-blue-500 hover:bg-blue-600"
            >
                Set Budget
            </Button>
        </div>
    )
}

const BudgetDisplay = ({ amount }: { amount: number }) => (
    <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex justify-between items-center">
            <span className="text-gray-600">Today&apos;s Budget</span>
            <span className="text-lg font-semibold">₹{amount}</span>
        </div>
    </div>
)

const BudgetTable = ({ budgets, onDayClick }: {
    budgets: Partial<Budget>[],
    onDayClick: (day: string) => void
}) => {
    if (!budgets?.length) {
        return (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                No budgets found. Set your first budget!
            </div>
        )
    }

    return (
        <div className="rounded-lg border mt-2">
            <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-t-lg text-sm font-medium text-gray-500">
                <div>Date</div>
                <div className="text-right">Budget</div>
                <div className="text-right">Spent</div>
                <div className="text-right">Remaining</div>
            </div>
            <div className="divide-y">
                {budgets.map((budget, index) => (
                    <div
                        key={budget?.id ?? index}
                        onClick={() => budget.day && onDayClick(budget.day.toString())}
                        className="grid grid-cols-4 gap-4 p-4 items-center hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        <div className="text-sm">
                            {budget.day ? format(new Date(budget.day), 'MMM dd') : 'N/A'}
                        </div>
                        <div className="text-right font-medium">
                            ₹{budget.amount}
                        </div>
                        <div className="text-right text-red-600">
                            ₹{budget.amount && budget.remaining ? budget.amount - budget.remaining : 'N/A'}
                        </div>
                        <div className="text-right text-green-600">
                            {(budget.remaining && budget.remaining > 0) ? `₹${budget.remaining}` : 'N/A'}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function Dashboard() {
    const { budgets } = useBudgets()
    const { addBudget, updateBudget } = useExpenseActions()
    const router = useRouter()


    const todayBudget = useMemo(() => {
        const today = new Date()
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

        return budgets?.find(budget => {
            if (budget.day) {
                const budgetDate = new Date(budget.day)
                return budgetDate >= startOfDay && budgetDate < endOfDay
            }
            return false
        })
    }, [budgets])

    // TODO [OPTIMIZE]
    const handleAddTodayBudget = async (amount: number) => {
        if (!amount) return
        addBudget({ day: new Date().toISOString(), amount, remaining: amount, id: -1 })
        expenseApi.addBudget(amount)
            .then((data) => updateBudget(-1, data.budget))
            .catch(err => {
                //TODO: 
                console.log(err)
            })
    }

    const handleNavigateToExpensePage = useCallback((day: string) => {
        router.push(`/expense/${dateToString(day)}`)
    }, [router])

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

                        {!todayBudget ? (
                            <BudgetInput onSubmit={handleAddTodayBudget} />
                        ) : (
                            <BudgetDisplay amount={todayBudget.amount ?? NaN} />
                        )}
                    </div>
                </CardContent>
            </Card>

            <BudgetTable
                budgets={budgets}
                onDayClick={handleNavigateToExpensePage}
            />
        </div>
    )
}