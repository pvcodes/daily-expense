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

// MONTHLY EXPENSES
export const getTotalSpendInMonth = async (mid: string, userId: number) => {
	try {
		console.log({ mid });
		const monthlyExpenses = await db.monthlyExpense.findMany({
			where: { mid, userId },
			// select: { amount: true },
		});
		console.log(monthlyExpenses);
		const totalSpend = monthlyExpenses.reduce(
			(acc, expense) => acc + expense.amount,
			0
		);

		return {
			totalSpend,
		};
	} catch (error) {
		console.error("Error fetching total expenses:", error);
		return {
			totalSpend: NaN,
		};
	}
};

export const getMonthlyExpenses = async (mid: string, userId: number) => {
	const monthlyExpenses = await db.monthlyExpense.findMany({
		where: { mid, userId },
	});

	const totalSpend = monthlyExpenses.reduce(
		(acc, expense) => acc + expense.amount,
		0
	);

	// Calculate the maximum spend in a single day and track the date
	const dailySpendMap = new Map<string, number>();

	monthlyExpenses.forEach((expense) => {
		const dateKey = expense.date.toISOString().split("T")[0]; // Get the date part
		const currentSpend = dailySpendMap.get(dateKey) || 0;
		dailySpendMap.set(dateKey, currentSpend + expense.amount);
	});

	let maxSpendInDay = 0;
	let maxSpendDate = "";

	dailySpendMap.forEach((dailySpend, date) => {
		if (dailySpend > maxSpendInDay) {
			maxSpendInDay = dailySpend;
			maxSpendDate = date;
		}
	});

	return {
		monthlyExpenses,
		totalSpend,
		maxSpendInDay: {
			amount: maxSpendInDay,
			date: maxSpendDate,
		},
	};
};

export const getDistinctMidsWithTotalSpend = async (userId: number) => {
	try {
		const distinctMids = await db.monthlyExpense.findMany({
			distinct: ["mid"],
			where: { userId },
			select: { mid: true },
		});

		const midsWithTotalSpend = await Promise.all(
			distinctMids.map(async (expense) => {
				const totalSpend = await db.monthlyExpense.aggregate({
					where: { mid: expense.mid },
					_sum: { amount: true },
				});
				return {
					mid: expense.mid,
					totalSpend: totalSpend._sum.amount || 0,
				};
			})
		);

		return midsWithTotalSpend;
	} catch (error) {
		console.error("Error fetching distinct mids with total spend:", error);
		return [];
	}
};
