export interface Expense {
	id?: number;
	amount: number;
	description: string;
	date: Date;
	userId?: number;
	budgetId?: number;
}

export interface Budget {
	id: number;
	day: Date;
	amount: number;
	userId: number;
	remaining: number;
}
