import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { produce } from "immer";
import { expenseApi } from "@/service/expenseService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { Budget, Expense } from "@/types/expense";
import { dateToString } from "@/lib/utils";
import { STALE_TIME, REFETCH_INTERVAL } from "@/constant";

interface ExpenseState {
	expenses: Record<string, Partial<Expense>[]>;
	budgets: Budget[];
	actions: {
		setExpenses: (day: string, expenses: Expense[]) => void;
		addExpense: (day: string, expense: Expense) => void;
		removeExpense: (day: string, expenseId: number) => void;
		updateExpense: (
			day: string,
			expenseId: number,
			updatedExpense: Partial<Expense>
		) => void;
		setBudgets: (budgets: Budget[]) => void;
		addBudget: (budget: Budget) => void;
		removeBudget: (budgetId: number) => void;
		updateBudget: (
			budgetId: number,
			updatedBudget: Partial<Budget>
		) => void;
	};
}

const useExpenseStore = create<ExpenseState>()(
	devtools(
		persist(
			(set) => ({
				expenses: {},
				budgets: [],
				actions: {
					setExpenses: (day, expenses) =>
						set(
							produce((state: ExpenseState) => {
								state.expenses[day] = expenses;
							})
						),

					addExpense: (day, expense) =>
						set(
							produce((state: ExpenseState) => {
								const budget = state.budgets.find(
									(b) => dateToString(b.day) === day
								);
								if (budget) {
									budget.remaining = Number(
										(
											budget.remaining - expense.amount
										).toFixed(2)
									);
								}
								if (!state.expenses[day]) {
									state.expenses[day] = [];
								}
								state.expenses[day].unshift(expense);
							})
						),

					removeExpense: (day, expenseId) =>
						set(
							produce((state: ExpenseState) => {
								const expense = state.expenses[day]?.find(
									(e) => e.id === expenseId
								);
								const budget = state.budgets.find(
									(b) => dateToString(b.day) === day
								);
								if (expense && budget) {
									budget.remaining = Number(
										(
											budget.remaining +
											(expense.amount || 0)
										).toFixed(2)
									);
								}
								state.expenses[day] =
									state.expenses[day]?.filter(
										(e) => e.id !== expenseId
									) || [];
							})
						),

					updateExpense: (day, expenseId, updatedExpense) =>
						set(
							produce((state: ExpenseState) => {
								const expenseIndex = state.expenses[
									day
								]?.findIndex((e) => e.id === expenseId);
								if (
									expenseIndex !== undefined &&
									expenseIndex !== -1
								) {
									const oldAmount =
										state.expenses[day][expenseIndex]
											.amount || 0;
									const newAmount =
										updatedExpense.amount || oldAmount;
									const budget = state.budgets.find(
										(b) => dateToString(b.day) === day
									);
									if (budget) {
										budget.remaining = Number(
											(
												budget.remaining +
												oldAmount -
												newAmount
											).toFixed(2)
										);
									}
									state.expenses[day][expenseIndex] = {
										...state.expenses[day][expenseIndex],
										...updatedExpense,
									};
								}
							})
						),

					setBudgets: (budgets) =>
						set(
							produce((state: ExpenseState) => {
								state.budgets = budgets;
							})
						),

					addBudget: (budget) =>
						set(
							produce((state: ExpenseState) => {
								const existingIndex = state.budgets.findIndex(
									(b) => b.id === budget.id
								);
								if (existingIndex === -1) {
									state.budgets.unshift(budget);
								} else {
									state.budgets[existingIndex] = budget;
								}
							})
						),

					removeBudget: (budgetId) =>
						set(
							produce((state: ExpenseState) => {
								state.budgets = state.budgets.filter(
									(b) => b.id !== budgetId
								);
							})
						),

					updateBudget: (budgetId, updatedBudget) =>
						set(
							produce((state: ExpenseState) => {
								const budgetIndex = state.budgets.findIndex(
									(b) => b.id === budgetId
								);
								if (budgetIndex !== -1) {
									state.budgets[budgetIndex] = {
										...state.budgets[budgetIndex],
										...updatedBudget,
									};
								}
							})
						),
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

export const useBudgets = (pageNo = 1, limit = 10) => {
	const queryClient = useQueryClient();
	const { setBudgets } = useExpenseActions();
	const budgets = useExpenseStore((state) => state.budgets);

	const { data, isLoading, error, isError } = useQuery({
		queryKey: ["budgets", pageNo, limit],
		queryFn: async () => {
			const result = await expenseApi.fetchBudgets(pageNo, limit);
			result?.budgets?.forEach((budget) => {
				queryClient.setQueryData(
					["budgets", dateToString(budget.day)],
					budget
				);
			});
			return result.budgets;
		},
		staleTime: STALE_TIME,
		retry: 1,
		retryDelay: 120000,
	});

	useEffect(() => {
		if (data) {
			setBudgets(data);
		}
	}, [data, setBudgets]);

	return { budgets, isLoading, error, isError };
};

export const useBudget = (day: string) => {
	const { addBudget } = useExpenseActions();
	const budget = useExpenseStore(
		useCallback(
			(state) => state.budgets.find((b) => dateToString(b.day) === day),
			[day]
		)
	);

	const { isLoading, error, isError } = useQuery({
		queryKey: ["budgets", day],
		queryFn: async () => {
			const data = await expenseApi.fetchBudget(day);
			if (data.budget) {
				addBudget(data.budget);
			}
			return data.budget;
		},
		staleTime: STALE_TIME,
		refetchInterval: REFETCH_INTERVAL,
	});

	return { budget, isLoading, error, isError };
};

export const useExpenses = (day: string) => {
	const { setExpenses } = useExpenseActions();
	const expenses = useExpenseStore((state) => state.expenses[day]);

	const { data, isLoading, error, isError } = useQuery({
		queryKey: ["expenses", day],
		queryFn: () => expenseApi.fetchExpenses(day),
		staleTime: STALE_TIME,
		refetchInterval: REFETCH_INTERVAL,
	});

	useEffect(() => {
		if (data?.expenses) {
			setExpenses(day, data.expenses);
		}
	}, [data, day, setExpenses]);

	return { expenses, isLoading, error, isError };
};

export const useExpenseActions = () =>
	useExpenseStore((state) => state.actions);

export default useExpenseStore;
