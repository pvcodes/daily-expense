'use client'
import { useState } from "react"
import { TypographyH3 } from "@/components/Typography"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { IndianRupeeIcon, Wallet } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Budget } from "@/types/expense"
import { compareDate, dateToString } from "@/lib/utils"
import { toast } from "sonner"
import { MAX_INT } from "@/constant"
import Link from "next/link"


// Components
const BudgetInput = ({
    onSubmit
}: {
    onSubmit: (amount: number) => void
}) => {
    const [amount, setAmount] = useState<number>(NaN)

    const handleSubmit = () => {
        if (!amount) return
        onSubmit(amount)
        setAmount(NaN)
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

const BudgetTable = ({ budgets }: {
    budgets: Budget[],
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
                    <Link href={`/expense/${dateToString(budget.day)}`} key={budget?.id ?? index}>
                        <div
                            className="grid grid-cols-4 gap-4 p-4 items-center hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            <div className="text-sm">
                                {format(new Date(budget.day), 'MMM dd')}
                            </div>
                            <div className="text-right font-medium">
                                ₹{budget.amount}
                            </div>
                            <div className="text-right text-red-600">
                                ₹{budget.amount - budget.remaining}
                            </div>
                            <div className="text-right text-green-600">
                                {budget.remaining > 0 ? `₹${budget.remaining}` : 'N/A'}
                            </div>
                        </div>
                    </Link>

                ))}
            </div>
        </div>
    )
}





interface ExpenseDashboardProps {
    budgets: Budget[]

}

export default function ExpenseDashboard({ budgets: allBudgets }: ExpenseDashboardProps) {
    const [todayBudget, setTodayBudget] = useState(compareDate(allBudgets[0].day, new Date()) ? allBudgets[0] : null);
    const [budgets, setBudgets] = useState(allBudgets)


    // TODO [OPTIMIZE]
    const handleAddTodayBudget = async (amount: number) => {
        if (!amount) return

        if (amount > MAX_INT) {
            toast("Get a Investment Banker, we can't help")
            return
        }
        fetch("/api/budget/add-budget", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ amount }),
        }).then(async (res) => {
            if (!res.ok) {
                toast('Falied to add budget,Try again!')
                setBudgets(prev => prev.filter(budget => budget.id !== -1))
            } else {
                const data = await res.json()
                // setBudgets(prev => prev.map(budget => budget.id === -1 ? data.data.budget : budget))
                setBudgets(prev => ([data.data.budget, ...prev]))
                setTodayBudget(data.data.budget)

            }
        })


    }

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
                            <BudgetInput onSubmit={handleAddTodayBudget} />
                        )}
                    </div>
                </CardContent>
            </Card>

            <BudgetTable budgets={budgets} />
        </div>
    )
}