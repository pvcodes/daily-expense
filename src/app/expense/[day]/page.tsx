'use client'

import { notFound, usePathname } from 'next/navigation';
import { useBudgets, useExpenseActions, useExpenses } from "@/store/useExpenseStore"
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Calendar, IndianRupeeIcon } from 'lucide-react';
import { format } from 'date-fns';

interface SpendState {
    amount: number | '',
    description: string
}

export default function Page() {
    const pathname = usePathname();
    const day = pathname.split('/').pop() as string;
    const { addExpense, setExpenses, updateBudget } = useExpenseActions();
    const currDayExpenses = useExpenses()?.[day];
    const [spend, setSpend] = useState<SpendState>({ amount: '', description: '' });

    useEffect(() => {
        const fetchExpensesData = async () => {
            const response = await axios.get('/api/expense', { params: { day } });
            setExpenses(day, response.data.data.expenses);
        };
        fetchExpensesData();
        console.log('fetchExpensesData', 6789)
    }, [day, setExpenses]);

    const currBudget = useBudgets().find(budget => {
        const startOfDay = new Date(day);
        const endOfDay = new Date(day);
        endOfDay.setDate(endOfDay.getDate() + 1);
        const budgetDate = budget.day ? new Date(budget.day) : null;
        return budgetDate && budgetDate >= startOfDay && budgetDate < endOfDay;
    });

    const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!spend.amount || !spend.description) return;
        addExpense(day, { amount: spend.amount, description: spend.description });
        if (currBudget?.id && currBudget.remaining) {
            updateBudget(currBudget.id, { remaining: currBudget.remaining - spend.amount });
        } console.log(currBudget, 67890)

        try {
            await axios.post('/api/expense', {
                ...spend,
                budgetId: currBudget?.id
            });
            setSpend({ amount: '', description: '' });
        } catch (error) {
            console.log(error)
            // TODO: Add error handling
        }
    };

    if (!currBudget) return notFound()

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
                <Card className="bg-green-50 border-green-100">
                    <CardContent className="p-4">
                        <div className="text-sm text-gray-600">Budget Left</div>
                        <div className="text-2xl font-bold text-green-700">
                            &#8377;{Number(currBudget?.remaining).toFixed(2)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Add New Expense</CardTitle>
                </CardHeader>
                <CardContent>
                    <form className="flex flex-col gap-4" onSubmit={handleAddExpense}>
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative w-full md:flex-1">
                                <IndianRupeeIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    type="number"
                                    placeholder="Amount"
                                    className="pl-9"
                                    value={spend.amount}
                                    onChange={(e) => setSpend(s => ({ ...s, amount: Number(e.target.value) }))}
                                />
                            </div>
                            <div className="w-full md:flex-[2]">
                                <Input
                                    placeholder="Description"
                                    value={spend.description}
                                    onChange={(e) => setSpend(s => ({ ...s, description: e.target.value }))}
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

            {currDayExpenses && currDayExpenses.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Today&apos;s Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {currDayExpenses.map((expense, index) => (
                                <div
                                    key={expense.id ?? index}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex-1">
                                        <div className="font-medium">{expense.description}</div>
                                    </div>
                                    <div className="text-right font-semibold">
                                        &#8377;{Number(expense.amount).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}