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
	console.log(budget);
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
