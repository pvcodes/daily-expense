import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { produce } from "immer";
import { Bin } from "@/types/bin";

interface BinState {
	bins: Partial<Bin>[]; // Updated from notes to bins
	isLoading: boolean;
	error: string | null;

	actions: {
		setBins: (bins: Partial<Bin>[]) => void; // Updated from setNotes to setBins
		addBin: (bin: Partial<Bin>) => void; // Updated from addNote to addBin
		removeBin: (binUid: string) => void; // Updated from removeNote to removeBin
		updateBin: (binUid: string, updatedBin: Partial<Bin>) => void; // Updated from updateNote to updateBin
		setIsLoading: (loading: boolean) => void;
		setError: (error: string | null) => void;
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
					setBins: (
						bins: Partial<Bin>[] // Updated from setNotes to setBins
					) =>
						set(() => ({
							bins, // Updated from notes to bins
						})),
					addBin: (
						bin: Partial<Bin> // Updated from addNote to addBin
					) =>
						set(
							produce((state: BinState) => {
								state.bins.unshift(bin); // Updated from notes to bins
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
						updatedBin: Partial<Bin> // Updated from updateNote to updateBin
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
					setIsLoading: (loading: boolean) =>
						set(() => ({
							isLoading: loading,
						})),
					setError: (error: string | null) =>
						set(() => ({
							error,
						})),
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
					bins: state.bins, // Updated from notes to bins
					isLoading: state.isLoading,
					error: state.error,
				}),
			}
		),
		{
			name: "BinStore",
		}
	)
);

// State exports
export const useBins = () => useBinStore((state) => state.bins); // Updated from useNotes to useBins
export const useIsLoading = () => useBinStore((state) => state.isLoading);
export const useError = () => useBinStore((state) => state.error);

// Actions export
export const useBinActions = () => useBinStore((state) => state.actions);
