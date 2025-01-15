import db from "@/db";

export const getBudget = async (day: string, userId: number) => {
	const startOfDay = new Date(day);
	const endOfDay = new Date(startOfDay);
	endOfDay.setDate(endOfDay.getDate() + 1);
	const budget = await db.budget.findFirst({
		where: {
			day: {
				gte: startOfDay,
				lt: endOfDay,
			},
			userId,
		},
	});
	return budget;
};

export const getBudgetsInPagination = async (
	page: number,
	limit: number,
	userId: number
) => {
	const offset = (page - 1) * limit;

	const [budgets, total] = await Promise.all([
		db.budget.findMany({
			where: {
				userId,
			},
			skip: offset,
			take: limit,
			orderBy: {
				day: "desc",
			},
		}),
		db.budget.count({
			where: {
				userId,
			},
		}),
	]);

	return {
		budgets,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
			hasMore: offset + budgets.length < total,
		},
	};
};

export const getExpenseInPagination = async (
	page: number,
	limit: number,
	day: string,
	userId: number
) => {
	try {
		const dayToFind = new Date(day);
		const nextDay = new Date(day);
		nextDay.setDate(nextDay.getDate() + 1);

		const offset = (page - 1) * limit;

		const budget = await db.budget.findFirst({
			where: {
				userId,
				day: {
					gte: dayToFind,
					lte: nextDay,
				},
			},
		});

		const [expenses, total] = await Promise.all([
			db.expense.findMany({
				where: { userId, budgetId: budget?.id },
				skip: offset,
				take: limit,
				orderBy: {
					date: "desc",
				},
			}),
			db.expense.count({
				where: {
					userId,
					budgetId: budget?.id,
				},
			}),
		]);
		return {
			expenses,
			budget,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
				hasMore: offset + expenses.length < total,
			},
		};
	} catch (error) {
		console.log(error);
		return {
			expenses: null,
			budget: null,
			pagination: null,
		};
	}
};
