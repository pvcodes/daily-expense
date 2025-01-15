'use client'
import { MAX_INT } from "@/constant"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { IndianRupeeIcon, Loader2, Plus } from "lucide-react"
import { Input } from "../ui/input"
import { Button } from "../ui/button"

// Types
interface SpendState {
    amount: number
    description: string
}

const INITIAL_STATE_EXPENSE = { amount: NaN, description: '' }

const AddExpenseForm = ({ budgetId }: { budgetId: number }) => {
    const router = useRouter()
    const [spend, setSpend] = useState<SpendState>(INITIAL_STATE_EXPENSE)

    const [isLoading, setIsLoading] = useState(false)


    const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (spend.amount > MAX_INT) {
            toast("Get a Investment Banker, we can't help")
            return
        }

        setIsLoading(true)
        fetch("/api/expense", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ...spend,
                budgetId,
            })
        }).then((res) => {
            if (!res.ok) {
                toast('Failed to add expense, Try again!')
                return
            }
            router.refresh()
            setSpend(INITIAL_STATE_EXPENSE)
        }).finally(() => setIsLoading(false))

    }


    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Add New Expense</CardTitle>
            </CardHeader>
            <CardContent>
                {/* TODO: Use Shadn Ui Form */}
                <form className="flex flex-col gap-4" onSubmit={handleAddExpense}>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative w-full md:flex-1">
                            <IndianRupeeIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                type="number"
                                placeholder="Amount"
                                className="pl-9"
                                value={spend.amount}
                                onChange={(e) => setSpend({ ...spend, amount: Number(e.target.value) })}
                            />
                        </div>
                        <div className="w-full md:flex-[2]">
                            <Input
                                placeholder="Description"
                                value={spend.description}
                                onChange={(e) => setSpend({ ...spend, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <Button
                        className="w-full"
                        type='submit'
                        disabled={!spend.amount || !spend.description || isLoading}
                    >
                        {
                            isLoading ? <>
                                <Loader2 className="h-4 w-4 mr-4 animate-spin text-gray-500" />
                                <span>Adding...</span>

                            </> : <>
                                <Plus className="w-4 h-4 mr-2" />
                                <span>Add Expense</span>
                            </>
                        }
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

export default AddExpenseForm;