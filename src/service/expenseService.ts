import { ApiError, ApiResponse, Pagination } from "@/types/api";
import { Budget, Expense } from "@/types/expense";
import axios, { AxiosError } from "axios";

interface ALL_EXPENSES {
	expenses: Expense[];
	remainingBudget: number;
}

interface ALL_BUDGETS {
	budgets: Budget[];
	pagination: Pagination;
}
interface BUDGET {
	success: true;
	budget: Budget;
}

interface ADD_EXPENSE {
	expense: Expense;
	remainingBudget: number;
}

interface ADD_BUDGET {
	budget: Budget;
}

// EXPENSE API SERVICES
export const expenseApi = {
	fetchBudgets: async (page: number, limit: number) => {
		try {
			const response = await axios.get("/api/budget", {
				params: {
					page,
					limit,
				},
			});

			const data: ApiResponse<ALL_BUDGETS> = response.data;
			return data.data;
		} catch (error) {
			// TODO: Make it better
			throw new Error(
				(error as AxiosError<ApiError>)?.response?.data.message
			);
		}
	},

	fetchBudget: async (day: string) => {
		try {
			const response = await axios.get(`/api/budget/${day}`);
			const data: ApiResponse<BUDGET> = response.data;
			return data.data;
		} catch (error) {
			// TODO: Make it better
			throw new Error(
				(error as AxiosError<ApiError>)?.response?.data.message
			);
		}
	},

	addBudget: async (amount: number) => {
		try {
			const response = await axios.post("/api/budget/add-budget", {
				amount,
			});
			const data: ApiResponse<ADD_BUDGET> = response.data;
			return data.data;
		} catch (error) {
			// TODO: Make it better
			throw new Error(
				(error as AxiosError<ApiError>)?.response?.data.message
			);
		}
	},

	// EXPENSES
	fetchExpenses: async (day: string) => {
		try {
			const response = await axios.get("/api/expense", {
				params: { day },
			});

			const data: ApiResponse<ALL_EXPENSES> = response.data;
			return data.data;
		} catch (error) {
			// TODO: Make it better
			throw new Error(
				(error as AxiosError<ApiError>)?.response?.data.message
			);
		}
	},

	addExpense: async (
		expense: { amount: number; description: string },
		budgetId: number
	) => {
		try {
			const response = await axios.post("/api/expense", {
				...expense,
				budgetId,
			});
			const data: ApiResponse<ADD_EXPENSE> = response.data;
			return data.data.expense;
		} catch (error) {
			// TODO: Make it better
			throw new Error(
				(error as AxiosError<ApiError>)?.response?.data.message
			);
		}
	},
};
