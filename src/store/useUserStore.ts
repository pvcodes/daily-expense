import { User } from "@/types/user";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { useExpenseActions } from "./useExpenseStore";
import { useUiActions } from "./useUiStore";
import { useBinActions } from "./useBinStore";

interface UserState {
	user: User | null;
	actions: {
		setUserAction: (user: User) => void;
		resetStore: () => void;
	};
}

const useUserStore = create<UserState>()(
	devtools(
		persist(
			(set) => ({
				user: null,
				actions: {
					setUserAction: (user: User) => set({ user }),
					resetStore: () =>
						set(() => {
							const { resetState: resetExpenseState } =
								useExpenseActions();
							const { resetState: resetUiState } = useUiActions();
							const { resetState: resetBinState } =
								useBinActions();

							resetExpenseState();
							resetUiState();
							resetBinState();
							return { user: null };
						}),
				},
			}),
			{
				name: "user-storage",
				partialize: (state: UserState) => ({
					user: state.user,
				}),
			}
		),
		{
			name: "UserStore",
		}
	)
);

// State exports
export const useUser = () => useUserStore((state) => state.user);

// Actions export
export const useUserActions = () => useUserStore((state) => state.actions);
