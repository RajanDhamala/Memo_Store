import { create } from 'zustand';

interface UserState {
  isAuthenticated: boolean;
  CurrentUser: object | null;
}

interface UserActions {
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setCurrentUser: (user: object | null) => void;
  resetUserState: () => void;
}

const useUserStore = create<UserState & UserActions>((set) => ({
  isAuthenticated: false,
  CurrentUser: null,
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setCurrentUser: (user) => set({ CurrentUser: user }),
  resetUserState: () => set({ isAuthenticated: false, CurrentUser: null }),
}));

export default useUserStore;
