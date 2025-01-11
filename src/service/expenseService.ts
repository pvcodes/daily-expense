// services/expenseService.ts
import axios from "axios";
import { useEffect, useMemo } from "react";
import { useBudgets, useExpenseActions } from "@/store/useExpenseStore";
import { Budget } from "@prisma/client";

// API Service
export const expenseApi = {
	fetchBudgets: async (page = 1, limit = 10) => {
		const response = await axios.get("/api/budget", {
			params: { page, limit },
		});
		return response.data.data.budgets;
	},

	fetchExpenses: async (day: string) => {
		const response = await axios.get("/api/expense", { params: { day } });
		return response.data.data.expenses;
	},

	addBudget: async (amount: number) => {
		const response = await axios.post("/api/budget/add-budget", { amount });
		return response.data;
	},

	addExpense: async (expense: {
		amount: number;
		description: string;
		budgetId?: number;
	}) => {
		const response = await axios.post("/api/expense", expense);
		return response.data;
	},
};

// Custom hooks for data fetching
export const useFetchBudgets = () => {
	const { setBudgets, setIsLoading, setError } = useExpenseActions();

	useEffect(() => {
		const fetchData = async () => {
			try {
				setIsLoading(true);
				const budgets = await expenseApi.fetchBudgets();
				setBudgets(budgets);
			} catch (error) {
				console.error("Failed to fetch budgets:", error);
				setError("Failed to fetch budgets");
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, [setBudgets, setIsLoading, setError]);
};

export const useFetchExpenses = (day: string) => {
	const { setExpenses, setIsLoading, setError } = useExpenseActions();

	useEffect(() => {
		const fetchData = async () => {
			try {
				setIsLoading(true);
				const expenses = await expenseApi.fetchExpenses(day);
				setExpenses(day, expenses);
			} catch (error) {
				console.error("Failed to fetch expenses:", error);
				setError("Failed to fetch expenses");
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, [day, setExpenses, setIsLoading, setError]);
};

// Action hooks that combine API calls with store updates
export const useExpenseOperations = () => {
	const { addExpense: addExpenseToStore, updateBudget: updateBudgetInStore } =
		useExpenseActions();

	const addExpense = async (
		day: string,
		expense: { amount: number; description: string },
		budget?: Partial<Budget>
	) => {
		try {
			// Update store optimistically
			addExpenseToStore(day, expense);

			if (budget?.id && budget.remaining) {
				updateBudgetInStore(budget.id, {
					remaining: budget.remaining - expense.amount,
				});
			}

			// Make API call
			await expenseApi.addExpense({
				...expense,
				budgetId: Number(budget?.id),
			});
		} catch (error) {
			console.error("Failed to add expense:", error);
			// TODO: Add rollback logic here if needed
			throw error;
		}
	};

	return { addExpense };
};

export const useBudgetOperations = () => {
	const { addBudget: addBudgetToStore } = useExpenseActions();

	const addBudget = async (amount: number) => {
		try {
			const newBudget = {
				amount,
				day: new Date(),
				remaining: amount,
			};

			// Update store optimistically
			addBudgetToStore(newBudget);

			// Make API call
			await expenseApi.addBudget(amount);
		} catch (error) {
			console.error("Failed to add budget:", error);
			// TODO: Add rollback logic here if needed
			throw error;
		}
	};

	return { addBudget };
};

export const useCurrentDayBudget = (day: string) => {
	const budgets = useBudgets();

	return useMemo(() => {
		return budgets.find((budget: Partial<Budget>) => {
			const startOfDay = new Date(day);
			const endOfDay = new Date(day);
			endOfDay.setDate(endOfDay.getDate() + 1);
			const budgetDate = budget.day ? new Date(budget.day) : null;
			return (
				budgetDate && budgetDate >= startOfDay && budgetDate < endOfDay
			);
		});
	}, [budgets, day]);
};
