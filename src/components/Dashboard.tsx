'use client'

import { useCallback, useState } from "react"
import { TypographyH3 } from "./Typography"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { useBudgets, useExpenseActions } from "@/store/useExpenseStore"
import axios from "axios"
import { format } from "date-fns"
import { IndianRupeeIcon, Wallet } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function Dashboard() {
    const { addBudget } = useExpenseActions()
    const budgets = useBudgets()
    const [budget, setBudget] = useState<number | ''>('')
    const router = useRouter()



    const getTodayBudget = useCallback(() => {
        const today = new Date()
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

        return budgets.find(budget => {
            if (budget.day) {
                const budgetDate = new Date(budget.day)
                return budgetDate >= startOfDay && budgetDate < endOfDay
            }
            return null
        })
    }, [budgets])

    const handleAddTodayBudget = async () => {
        if (!budget) return

        try {
            const newBudget = {
                amount: budget,
                day: new Date(),
                remaining: budget
            }

            addBudget(newBudget)
            await axios.post('/api/budget/add-budget', { amount: budget })
            setBudget('')
        } catch (error) {
            console.error('Failed to add budget:', error)
        }
    }

    const handleNavigateToExpensePage = (day: string) => {
        router.push(`/expense/${new Date(day).toLocaleDateString`en-CA`}`)

    }

    const todayBudget = getTodayBudget()

    return (
        < div className="max-w-2xl mx-auto p-4 space-y-6" >
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <TypographyH3 className="flex items-center gap-2">
                                <Wallet className="h-6 w-6 text-blue-500" />
                                Plan Today&apos; Spending
                            </TypographyH3>
                            <span className="text-sm text-gray-500">
                                {format(new Date(), 'EEEE, MMM dd')}
                            </span>
                        </div>

                        {!todayBudget ? (
                            <div className="flex gap-3 items-center">
                                <div className="relative flex-1 max-w-xs group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                        <IndianRupeeIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <Input
                                        type="number"
                                        value={budget}
                                        onChange={(e) => setBudget(parseInt(e.target.value))}
                                        className="pl-10 h-12 text-lg transition-shadow focus:ring-2 ring-blue-100"
                                        placeholder="0.00"
                                    />
                                </div>
                                <Button
                                    onClick={handleAddTodayBudget}
                                    disabled={!budget}
                                    className="h-12 px-6 bg-blue-500 hover:bg-blue-600"
                                >
                                    Set Budget
                                </Button>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Today&apos;s Budget</span>
                                    <span className="text-lg font-semibold">${todayBudget.amount}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {
                budgets.length > 0 ? (
                    <div className="rounded-lg border">
                        <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-t-lg text-sm font-medium text-gray-500">
                            <div>Date</div>
                            <div className="text-right">Budget</div>
                            <div className="text-right">Spent</div>
                            <div className="text-right">Remaining</div>
                        </div>
                        <div className="divide-y">
                            {budgets.map((budget, index) => (
                                <div
                                    key={budget?.id ?? index + 1}
                                    className="grid grid-cols-4 gap-4 p-4 items-center hover:bg-gray-50 transition-colors"
                                    onClick={() => budget.day && handleNavigateToExpensePage(budget.day.toString())}
                                >
                                    <div className="text-sm">
                                        {budget.day ? format(new Date(budget.day), 'MMM dd') : 'N/A'}
                                    </div>
                                    <div className="text-right font-medium">
                                        ${budget.amount}
                                    </div>
                                    <div className="text-right text-red-600 flex items-center justify-end gap-1">
                                        {/* <TrendingDown className="h-3 w-3" /> */}
                                        ${budget.amount && budget.remaining ? budget.amount - budget.remaining : 'N/A'}
                                    </div>
                                    <div className="text-right text-green-600">
                                        ${budget.remaining}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                        No budgets found. Set your first budget!
                    </div>
                )
            }
        </div >
    )
}