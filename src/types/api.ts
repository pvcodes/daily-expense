export interface ApiResponse<T> {
	success: boolean;
	data: T;
}

export interface ApiError {
	success: false;
	message: string;
	error: object | string;
}

export interface Pagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasMore: boolean;
}
