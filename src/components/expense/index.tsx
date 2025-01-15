import { Budget } from "@/types/expense"
import Link from "next/link"
import { format } from "date-fns"
import { dateToString } from "@/lib/utils"

export function BudgetTable({ budgets }: { budgets: Budget[] }) {

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
                    <Link
                        key={budget?.id ?? index}
                        href={{
                            pathname: `/expense/${dateToString(budget.day)}`,
                        }}
                    >
                        <div className="grid grid-cols-4 gap-4 p-4 items-center hover:bg-gray-50 transition-colors cursor-pointer">
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

export function BudgetDisplay({ amount }: { amount: number }) {
    return (
        <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-center">
                <span className="text-gray-600">Today&apos;s Budget</span>
                <span className="text-lg font-semibold">₹{amount}</span>
            </div>
        </div>
    )
}
