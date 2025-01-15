'use client'
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { IndianRupeeIcon } from "lucide-react"
import { toast } from "sonner"
import { MAX_INT } from "@/constant"
import { useRouter } from "next/navigation"

export function AddBudgetForm() {
    const [amount, setAmount] = useState<number>(NaN)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async () => {
        if (!amount) return
        if (amount > MAX_INT) {
            toast("Get a Investment Banker, we can't help")
            return
        }

        setIsLoading(true)
        fetch("/api/budget/add-budget", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount }),
        }).then((res) => {
            if (!res.ok) {
                toast('Failed to add budget, Try again!')
                return
            }
            router.refresh()
            setAmount(NaN)
        }).finally(() => setIsLoading(false))

        router.refresh()
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
                    disabled={isLoading}
                />
            </div>
            <Button
                onClick={handleSubmit}
                disabled={!amount || isLoading}
                className="h-12 px-6 bg-blue-500 hover:bg-blue-600"
            >
                {isLoading ? 'Adding...' : 'Set Budget'}
            </Button>
        </div>
    )
}

