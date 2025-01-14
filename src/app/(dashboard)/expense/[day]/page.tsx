'use client'

import { usePathname } from 'next/navigation'
import React, { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlusCircle, Calendar, IndianRupeeIcon } from 'lucide-react'
import { format } from 'date-fns'
import { TypographyMuted } from '@/components/Typography'
import { Expense } from '@/types/expense'
import { useExpenseActions, useExpenses, useBudget } from '@/store/useExpenseStore'
import { expenseApi } from '@/service/expenseService'
import { toast } from 'sonner'
import { MAX_INT } from '@/constant'


// Types
interface SpendState {
    amount: number
    description: string
}

// Components
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

const ExpenseForm = ({
    onSubmit,
    spend,
    onSpendChange
}: {
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
    spend: SpendState
    onSpendChange: (spend: SpendState) => void
}) => (
    <Card>
        <CardHeader>
            <CardTitle className="text-lg">Add New Expense</CardTitle>
        </CardHeader>
        <CardContent>
            <form className="flex flex-col gap-4" onSubmit={onSubmit}>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative w-full md:flex-1">
                        <IndianRupeeIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                            type="number"
                            placeholder="Amount"
                            className="pl-9"
                            value={spend.amount}
                            onChange={(e) => onSpendChange({ ...spend, amount: Number(e.target.value) })}
                        />
                    </div>
                    <div className="w-full md:flex-[2]">
                        <Input
                            placeholder="Description"
                            value={spend.description}
                            onChange={(e) => onSpendChange({ ...spend, description: e.target.value })}
                        />
                    </div>
                </div>
                <Button
                    className="w-full"
                    type='submit'
                    disabled={!spend.amount || !spend.description}
                >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add Expense
                </Button>
            </form>
        </CardContent>
    </Card>
)

const ExpensesList = ({ expenses, totalExpended }: { expenses: Partial<Expense>[], totalExpended: number }) => (
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
                {expenses.map((expense, index) => (
                    <div
                        key={expense.id ?? index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                        <div className="flex-1">
                            <div className="font-medium">{expense.description}</div>
                        </div>
                        <div className="text-right font-semibold">
                            ₹{Number(expense.amount).toFixed(2)}
                        </div>
                    </div>
                ))}
            </div>
        </CardContent>
    </Card>
)

export default function ExpensePage() {
    const pathname = usePathname()
    const day = pathname.split('/').pop() as string
    const { expenses: currDayExpenses } = useExpenses(day)
    const { budget: currBudget } = useBudget(day)
    const { addExpense, updateExpense } = useExpenseActions()



    const [spend, setSpend] = useState<SpendState>({ amount: NaN, description: '' })

    const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (spend.amount > MAX_INT) {
            toast("Get a Investment Banker, we can't help")
            return
        }
        if (!currBudget?.id) { toast('Something went wrong, Please refresh'); return }
        if (!spend.amount || !spend.description) return

        try {
            addExpense(day, { ...spend, date: new Date(), id: -1 })
            expenseApi.addExpense(spend, currBudget.id)
                .then((data) => updateExpense(day, -1, data))
                .catch((err) => {
                    // TODO:
                    console.log(err)
                })

            setSpend({ amount: NaN, description: '' })
        } catch (error) {
            console.error('Failed to add expense:', error)
        }
    }

    const totalExpended = useMemo(() => {
        return Number(currBudget?.amount) - Number(currBudget?.remaining)
    }, [currBudget])

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Daily Expenses</h1>
                    <div className="flex items-center text-gray-500 mt-1">
                        <Calendar className="w-4 h-4 mr-2" />
                        {format(new Date(day), 'MMMM d, yyyy')}
                    </div>
                </div>
                {currBudget && <BudgetCard remaining={currBudget.remaining ?? NaN} />}
            </div>

            <ExpenseForm
                onSubmit={handleAddExpense}
                spend={spend}
                onSpendChange={setSpend}
            />

            {currDayExpenses?.length > 0 && (
                <ExpensesList
                    expenses={currDayExpenses}
                    totalExpended={totalExpended}
                />
            )}
        </div>
    )
}