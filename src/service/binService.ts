import { ApiResponse, Pagination } from "@/types/api";
import { Bin } from "@/types/bin";
import axios from "axios";

interface ALL_BINS {
	bins: Bin[];
	pagination: Pagination;
}

export const binApi = {
	fetchBins: async (page: number, limit: number) => {
		try {
			const response = await axios.get("/api/bin", {
				params: { page, limit },
			});
			const data: ApiResponse<ALL_BINS> = response.data;

			// TODO: pagination data also come
			return data.data;
		} catch (error) {
			throw error;
		}
	},
	addBin: async (bin: Partial<Bin>) => {
		try {
			const response = await axios.post("/api/bin", bin);
			return response.data.data.bin;
		} catch (error) {
			throw error;
		}
	},
	updateBin: async (bin: Partial<Bin>) => {
		try {
			const response = await axios.put("/api/bin", bin);
			return response.data.data.bin;
		} catch (error) {
			throw error;
		}
	},
	deleteBin: async (uid: string) => {
		try {
			const response = await axios.delete("/api/bin", {
				params: { uid },
			});
			return response.data.data.bin;
		} catch (error) {
			throw error;
		}
	},
	fetchSingleBin: async (uid: string) => {
		try {
			const response = await axios.get(`/api/bin/${uid}`);
			return response.data.data.bin as Bin;
		} catch (error) {
			throw error;
		}
	},
};
