import db from "@/db";

export const getBinsInPagination = async (
	limit: number,
	userId: number,
	page = 1
) => {
	const offset = (page - 1) * limit;
	const [bins, total] = await Promise.all([
		db.bin.findMany({
			where: {
				userId,
			},
			skip: offset,
			take: limit,
			orderBy: {
				createdAt: "desc",
			},
		}),
		db.bin.count({
			where: {
				userId,
			},
		}),
	]);

	return {
		bins,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
			hasMore: offset + bins.length < total,
		},
	};
};

export const getBin = async (uid: string) => {
	try {
		const bin = await db.bin.findUniqueOrThrow({
			where: { uid },
		});
		return bin;
	} catch (error) {
		console.log(error);
		return null;
	}
};
