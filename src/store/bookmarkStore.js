import { create } from "zustand";

// Post ids the signed-in user has saved, oldest first (kept in sync by
// useBookmarksSync)
const useBookmarkStore = create((set) => ({
  postIds: [],
  setPostIds: (postIds) => set({ postIds }),
}));

export default useBookmarkStore;
