import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { produce } from "immer";
import { expenseApi } from "@/service/expenseService";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Budget, Expense } from "@/types/expense";
import { dateToString } from "@/lib/utils";

interface ExpenseState {
	expenses: Record<string, Partial<Expense>[]>;
	budgets: Budget[];

	actions: {
		// Expense actions
		setExpenses: (day: string, expenses: Expense[]) => void;
		addExpense: (day: string, expense: Expense) => void;
		removeExpense: (day: string, expenseId: number) => void;
		updateExpense: (
			day: string,
			expenseId: number,
			updatedExpense: Partial<Expense>
		) => void;

		// Budget actions
		setBudgets: (budgets: Budget[]) => void;
		addBudget: (budget: Budget) => void;
		removeBudget: (budgetId: number) => void;
		updateBudget: (
			budgetId: number,
			updatedBudget: Partial<Budget>
		) => void;

		resetState: () => void;
	};
}

export const useExpenseStore = create<ExpenseState>()(
	devtools(
		persist(
			(set) => ({
				expenses: {},
				budgets: [],
				isLoading: false,
				error: null,
				info: {
					totalBudgets: null,
					todayBudgetLeft: null,
					totalExpense: [],
				},
				actions: {
					// Expense actions
					setExpenses: (day: string, expenses: Partial<Expense>[]) =>
						set((state) => ({
							expenses: { ...state.expenses, [day]: expenses },
						})),
					addExpense: (day: string, expense: Expense) =>
						set(
							produce((state: ExpenseState) => {
								const budgetIndex = state.budgets.findIndex(
									(budget) => dateToString(budget.day) === day
								);
								state.budgets[budgetIndex].remaining -=
									expense.amount;

								state.expenses[day].unshift(expense);
							})
						),
					removeExpense: (day: string, expenseId: number) =>
						set((state) => ({
							expenses: {
								...state.expenses,
								[day]: state.expenses[day].filter(
									(expense) => expense.id !== expenseId
								),
							},
						})),
					updateExpense: (
						day: string,
						expenseId: number,
						updatedExpense: Partial<Expense>
					) =>
						set((state) => ({
							expenses: {
								...state.expenses,
								[day]: state.expenses[day].map((expense) =>
									expense.id === expenseId
										? { ...expense, ...updatedExpense }
										: expense
								),
							},
						})),

					// Budget actions
					setBudgets: (budgets: Budget[]) => set(() => ({ budgets })),
					addBudget: (budget: Budget) =>
						set(
							produce((state: ExpenseState) => {
								state.budgets.unshift(budget);
							})
						),
					removeBudget: (budgetId: number) =>
						set((state) => ({
							budgets: state.budgets.filter(
								(budget) => budget.id !== budgetId
							),
						})),
					updateBudget: (
						budgetId: number,
						updatedBudget: Partial<Budget>
					) =>
						set((state) => ({
							budgets: state.budgets.map((budget) =>
								budget.id === budgetId
									? { ...budget, ...updatedBudget }
									: budget
							),
						})),

					resetState: () =>
						set(() => ({
							expenses: {},
							budgets: [],
							isLoading: false,
							error: null,
						})),
				},
			}),
			{
				name: "expense-storage",
				partialize: (state: ExpenseState) => ({
					expenses: state.expenses,
					budgets: state.budgets,
				}),
			}
		),
		{
			name: "ExpenseStore",
		}
	)
);

// State exports
export const useBudgets = (pageNo: number = 1, limit: number = 10) => {
	const budgets = useExpenseStore((state) => state.budgets);
	const { setBudgets } = useExpenseActions();
	const { data, isLoading, error, isError } = useQuery({
		queryKey: ["budgets", `${pageNo}-${limit}`],
		queryFn: () => expenseApi.fetchBudgets(pageNo, limit),
		staleTime: 300000,
		retry: 1,
		retryDelay: 120000,
	});
	useEffect(() => {
		if (data?.budgets) setBudgets(data.budgets);
	}, [data, setBudgets]);

	return { budgets, isLoading, error, isError };
};

export const useExpenses = (day: string) => {
	const expenses = useExpenseStore((state) => state.expenses);
	const { setExpenses } = useExpenseActions();
	const { data, isLoading, error, isError } = useQuery({
		queryKey: ["expenses", `${day}`],
		queryFn: () => expenseApi.fetchExpenses(day),
		staleTime: 300000,
		refetchInterval: 20000,
	});
	useEffect(() => {
		if (data?.expenses) setExpenses(day, data?.expenses);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [data, setExpenses]);

	return { expenses: expenses[day], isLoading, error, isError };
};

// Actions export
export const useExpenseActions = () =>
	useExpenseStore((state) => state.actions);
