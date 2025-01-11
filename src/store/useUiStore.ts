import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface UiState {
	hasShowNoti: boolean;
	actions: {
		setHasShowNoti: () => void;
	};
}

const useUiStore = create<UiState>()(
	devtools(
		persist(
			(set) => ({
				hasShowNoti: false,
				actions: {
					setHasShowNoti: () => set({ hasShowNoti: true }),
				},
			}),
			{
				name: "ui-storage",
				partialize: (state: UiState) => ({
					hasShowNoti: state.hasShowNoti,
				}),
			}
		),
		{
			name: "UiStore",
		}
	)
);

// State exports
export const useHasShowNotification = () =>
	useUiStore((state) => state.hasShowNoti);

// Actions export
export const useUiActions = () => useUiStore((state) => state.actions);
