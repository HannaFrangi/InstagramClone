import { create } from "zustand";

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem("user-info")),
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
  setUser: (user) => set({ user }),

  rehydrateUser: () => {
    const storedUser = JSON.parse(localStorage.getItem("user-info"));
    if (storedUser) {
      set({ user: storedUser });
    }
  },
}));

export default useAuthStore;
