'use client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getDateInMMYYYY } from "@/lib/utils"
import { useRouter } from "next/navigation"
import React, { useState } from "react"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { TypographyMuted } from "@/components/Typography"
import { Loader2Icon } from "lucide-react"

interface AddMonthlyExpenseFormProps {
    showDialog?: boolean
}

export const AddMonthlyExpenseForm: React.FC<AddMonthlyExpenseFormProps> = ({ showDialog = false }) => {
    const [expense, setExpense] = React.useState({ description: '', amount: '' })
    const router = useRouter()
    const currMonthStr = getDateInMMYYYY(new Date())

    const [isLoading, setIsLoading] = useState(false)

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault() // Prevent form default submission

        if (!expense.description || !expense.amount) {
            toast('Please fill in all fields')
            return
        }
        setIsLoading(true)

        try {
            const res = await fetch(`/api/expense/month/${currMonthStr}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...expense,
                    amount: Number(expense.amount)
                }),
            })

            if (!res.ok) {
                throw new Error('Failed to add expense')
            }

            toast('Expense added successfully')
            setExpense({ description: '', amount: '' }) // Reset form
            router.push(`/expense/month/${currMonthStr}`)
        } catch (error) {
            console.log(error)
            toast('An error occurred while adding the expense')
        } finally {
            setIsLoading(false)
        }
    }

    const formContent = (
        <form onSubmit={handleAddExpense} className="space-y-4">
            <Input
                type="text"
                value={expense.description}
                placeholder="Description"
                onChange={(e) => setExpense(prev => ({
                    ...prev,
                    description: e.target.value
                }))}
            />
            <Input
                type="number"
                value={expense.amount}
                placeholder="Amount"
                onChange={(e) => setExpense(prev => ({
                    ...prev,
                    amount: e.target.value
                }))}
            />
            <Button type="submit" disabled={isLoading}>
                {isLoading ?
                    <>
                        <Loader2Icon className="animate-spin" /> Adding...
                    </> :
                    'Add Expense'
                }
            </Button>
        </form>
    )

    return (
        <>
            {showDialog ? (
                <Dialog>
                    <DialogTrigger className="flex justify-end">
                        <Button className="h-12 px-6 bg-blue-500 hover:bg-blue-600">
                            Add Monthly Expense
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                <TypographyMuted>Add your first expense, for {format(new Date(), 'MMMM yyyy')}</TypographyMuted>
                            </DialogTitle>
                            <DialogDescription>
                                {formContent}
                            </DialogDescription>
                        </DialogHeader>
                    </DialogContent>
                </Dialog>
            ) : (
                formContent
            )}
        </>
    )
}