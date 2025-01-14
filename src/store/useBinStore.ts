import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { produce } from "immer";
import { Bin } from "@/types/bin";
import { useQuery } from "@tanstack/react-query";
import { binApi } from "@/service/binService";
import { useEffect } from "react";

interface BinState {
	bins: Bin[]; // Updated from notes to bins
	//TODO no user bins, when user fetch when he is not authenticated

	actions: {
		setBins: (bins: Bin[]) => void; // Updated from setNotes to setBins
		addBin: (bin: Bin) => void; // Updated from addNote to addBin
		removeBin: (binUid: string) => void; // Updated from removeNote to removeBin
		updateBin: (binUid: string, updatedBin: Bin) => void; // Updated from updateNote to updateBin
		resetState: () => void;
	};
}

const useBinStore = create<BinState>()(
	devtools(
		persist(
			(set) => ({
				bins: [], // Updated from notes to bins
				isLoading: false,
				error: null,
				actions: {
					setBins: (bins: Bin[]) => set(() => ({ bins })),
					addBin: (bin: Bin) =>
						set(
							produce((state: BinState) => {
								console.log(bin);
								const existingBin = state.bins.find(
									(b) => b.uid === bin.uid
								);
								console.log(existingBin);
								if (!existingBin) {
									state.bins.unshift(bin);
								}
							})
						),
					removeBin: (
						binUid: string // Updated from removeNote to removeBin
					) =>
						set((state) => ({
							bins: state.bins.filter(
								// Updated from notes to bins
								(bin) => bin.uid !== binUid
							),
						})),
					updateBin: (
						binUid: string,
						updatedBin: Bin // Updated from updateNote to updateBin
					) =>
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
					resetState: () =>
						set(() => ({
							bins: [], // Updated from notes to bins
							isLoading: false,
							error: null,
						})),
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

// State exports
// export const useBins = () => useBinStore((state) => state.bins); // Updated from useNotes to useBins

export const useBins = (pageNo: number = 1, limit: number = 10) => {
	const bins = useBinStore((state) => state.bins);
	const { setBins } = useBinActions();
	const { data, isLoading, error, isError } = useQuery({
		queryKey: ["bins", `${pageNo}-${limit}`],
		queryFn: () => binApi.fetchBins(pageNo, limit),
		staleTime: 300000,
	});
	useEffect(() => {
		console.log(data, 1231);
		if (data?.bins) setBins(data?.bins);
	}, [data, setBins]);

	return { bins, isLoading, error, isError };
};

// Actions export
export const useBinActions = () => useBinStore((state) => state.actions);

export default useBinStore;
