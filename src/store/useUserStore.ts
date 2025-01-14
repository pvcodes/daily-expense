import { User } from "@/types/user";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import useExpenseStore from "./useExpenseStore";
import useBinStore from "./useBinStore";
import { produce } from "immer";

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
						set(
							produce((state: UserState) => {
								useExpenseStore.persist.clearStorage();
								state.user = null;
								useUserStore.persist.clearStorage();
								useExpenseStore.persist.clearStorage();
								useBinStore.persist.clearStorage();
							})
						),
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
