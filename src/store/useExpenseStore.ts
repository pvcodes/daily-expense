import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { User, Expense, Budget } from "@prisma/client";
import { produce } from "immer";

interface ExpenseState {
	user: Partial<User> | null;
	expenses: Record<string, Partial<Expense>[]>;
	budgets: Partial<Budget>[];
	isLoading: boolean;
	error: string | null;

	actions: {
		setUser: (user: Partial<User> | null) => void;

		// Expense actions
		setExpenses: (day: string, expenses: Partial<Expense>[]) => void;
		addExpense: (day: string, expense: Partial<Expense>) => void;
		removeExpense: (day: string, expenseId: number) => void;
		updateExpense: (
			day: string,
			expenseId: number,
			updatedExpense: Partial<Expense>
		) => void;

		// Budget actions
		setBudgets: (budgets: Partial<Budget>[]) => void;
		addBudget: (budget: Partial<Budget>) => void;
		removeBudget: (budgetId: number) => void;
		updateBudget: (
			budgetId: number,
			updatedBudget: Partial<Budget>
		) => void;

		setIsLoading: (loading: boolean) => void;
		setError: (error: string | null) => void;

		resetState: () => void;
	};
}

const useExpenseStore = create<ExpenseState>()(
	devtools(
		persist(
			(set) => ({
				user: null,
				expenses: {}, // Initialize as an empty object
				budgets: [],
				isLoading: false,
				error: null,
				info: {
					totalBudgets: null,
					todayBudgetLeft: null,
					totalExpense: [],
				},
				actions: {
					setUser: (user: Partial<User> | null) =>
						set(() => ({
							user: user,
						})),

					// Expense actions
					setExpenses: (day: string, expenses: Partial<Expense>[]) =>
						set((state) => ({
							expenses: { ...state.expenses, [day]: expenses },
						})),
					addExpense: (day: string, expense: Partial<Expense>) =>
						set(
							produce((state: ExpenseState) => {
								// expenses: {
								// 	...state.expenses,
								// 	[day]: [
								// 		expense,
								// 		...(state.expenses[day] || []),
								// 	],
								// },
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
					setBudgets: (budgets: Partial<Budget>[]) =>
						set(() => ({
							budgets,
						})),
					addBudget: (budget: Partial<Budget>) =>
						set((state) => ({
							budgets: [...state.budgets, budget],
						})),
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

					// UI state actions
					setIsLoading: (loading: boolean) =>
						set(() => ({
							isLoading: loading,
						})),
					setError: (error: string | null) =>
						set(() => ({
							error,
						})),
					resetState: () =>
						set(() => ({
							user: null,
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
					user: state.user,
					expenses: state.expenses,
					budgets: state.budgets,
					isLoading: state.isLoading,
					error: state.error,
				}),
			}
		),
		{
			name: "ExpenseStore",
		}
	)
);

// State exports
export const useUser = () => useExpenseStore((state) => state.user);
export const useExpenses = () => useExpenseStore((state) => state.expenses);
export const useBudgets = () => useExpenseStore((state) => state.budgets);
export const useIsLoading = () => useExpenseStore((state) => state.isLoading);
export const useError = () => useExpenseStore((state) => state.error);

// Actions export
export const useExpenseActions = () =>
	useExpenseStore((state) => state.actions);
