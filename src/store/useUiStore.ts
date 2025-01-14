import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface UiState {
	hasShowNoti: boolean;
	isSidebarOpen: boolean;
	actions: {
		setHasShowNoti: () => void;
		setSidebarOpen: (isOpen: boolean) => void;
		resetState: () => void;
	};
}

const useUiStore = create<UiState>()(
	devtools(
		persist(
			(set) => ({
				hasShowNoti: false,
				isSidebarOpen: false,
				actions: {
					setHasShowNoti: () => set({ hasShowNoti: true }),
					setSidebarOpen: (isOpen: boolean) =>
						set({ isSidebarOpen: isOpen }),

					resetState: () =>
						set({ hasShowNoti: false, isSidebarOpen: false }),
				},
			}),
			{
				name: "ui-storage",
				partialize: (state: UiState) => ({
					hasShowNoti: state.hasShowNoti,
					sidebarOpen: state.isSidebarOpen,
				}),
			}
		),
		{
			name: "UiStore",
		}
	)
);

// State exports
export default useUiStore;

// Actions export
export const useUiActions = () => useUiStore((state) => state.actions);
