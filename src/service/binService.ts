import { useBinActions } from "@/store/useBinStore";
import { Bin } from "@/types/bin";
import axios from "axios";
import { useEffect } from "react";

export const binApi = {
	fetchBins: async (page = 1, limit = 10) => {
		try {
			const response = await axios.get("/api/bin", {
				params: { page, limit },
			});
			return response.data.data.bins;
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
};

export const useFetchBins = () => {
	const { setBins, setIsLoading, setError } = useBinActions();

	useEffect(() => {
		const fetchData = async () => {
			try {
				setIsLoading(true);
				const budgets = await binApi.fetchBins();
				setBins(budgets);
			} catch (error) {
				console.error("Failed to fetch bins:", error);
				setError("Failed to fetch bins");
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, [setBins, setIsLoading, setError]);
};

export const useBinOperations = () => {
	const {
		addBin: addBinToStore,
		updateBin: updateBinInStore,
		removeBin: removeBinInStore,
	} = useBinActions();

	const addBin = async (bin: Partial<Bin> & { uid: string }) => {
		try {
			addBinToStore(bin);
			await binApi.addBin(bin);
		} catch (error) {
			console.error("Failed to add bin:", error);
			// TODO: Add rollback logic here if needed
			throw error;
		}
	};

	const updateBin = async (uid: string, bin: Partial<Bin>) => {
		try {
			updateBinInStore(uid, bin);
			await binApi.updateBin(bin);
		} catch (error) {
			// TODO: Add rollback logic here if needed
			throw error;
		}
	};

	const deleteBin = async (uid: string) => {
		try {
			removeBinInStore(uid);
			await binApi.deleteBin(uid);
		} catch (error) {
			// TODO: Add rollback logic here if needed
			throw error;
		}
	};

	return { addBin, updateBin, deleteBin };
};
