import db from "@/db";

export const getBins = async (limit: number, userId: number) => {
	const bins = await db.bin.findMany({
		where: {
			userId,
		},
		orderBy: {
			createdAt: "desc",
		},
		take: limit,
	});
	return bins;
};
