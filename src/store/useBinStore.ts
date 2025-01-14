import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { produce } from "immer";
import { Bin } from "@/types/bin";
import { useQuery } from "@tanstack/react-query";
import { binApi } from "@/service/binService";
import { useCallback, useEffect } from "react";
import { STALE_TIME, REFETCH_INTERVAL } from "@/constant";

interface BinState {
	bins: Bin[];
	actions: {
		setBins: (bins: Bin[]) => void;
		addBin: (bin: Bin) => void;
		removeBin: (binUid: string) => void;
		updateBin: (binUid: string, updatedBin: Partial<Bin>) => void;
	};
}

const useBinStore = create<BinState>()(
	devtools(
		persist(
			(set) => ({
				bins: [],
				actions: {
					setBins: (bins) =>
						set(
							produce((state: BinState) => {
								state.bins = bins;
							})
						),

					addBin: (bin) =>
						set(
							produce((state: BinState) => {
								const existingBinIndex = state.bins.findIndex(
									(b) => b.uid === bin.uid
								);
								if (existingBinIndex === -1) {
									state.bins.unshift(bin);
								} else {
									state.bins[existingBinIndex] = {
										...state.bins[existingBinIndex],
										...bin,
									};
								}
							})
						),

					removeBin: (binUid) =>
						set(
							produce((state: BinState) => {
								state.bins = state.bins.filter(
									(bin) => bin.uid !== binUid
								);
							})
						),

					updateBin: (binUid, updatedBin) =>
						set(
							produce((state: BinState) => {
								const binIndex = state.bins.findIndex(
									(bin) => bin.uid === binUid
								);
								if (binIndex !== -1) {
									state.bins[binIndex] = {
										...state.bins[binIndex],
										...updatedBin,
									};
								}
							})
						),
				},
			}),
			{
				name: "bin-storage",
				partialize: (state: BinState) => ({
					bins: state.bins,
				}),
			}
		),
		{
			name: "BinStore",
		}
	)
);

export const useBins = (pageNo = 1, limit = 10) => {
	const { setBins } = useBinActions();
	const bins = useBinStore((state: BinState) => state.bins);

	const queryResult = useQuery({
		queryKey: ["bins", pageNo, limit],
		queryFn: async () => {
			const result = await binApi.fetchBins(pageNo, limit);
			return result;
		},
		staleTime: STALE_TIME,
		refetchInterval: REFETCH_INTERVAL,
	});

	const { data, isLoading, error, isError } = queryResult;

	useEffect(() => {
		if (data?.bins) {
			setBins(data.bins);
		}
	}, [data, setBins]);

	return {
		bins,
		isLoading,
		error,
		isError,
	};
};

export const useBinActions = () => {
	return useBinStore(useCallback((state: BinState) => state.actions, []));
};

export default useBinStore;
