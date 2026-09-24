import { create } from "zustand";

const usePostStore = create((set) => ({
  posts: [],
  createPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),
  deletePost: (id) =>
    set((state) => ({ posts: state.posts.filter((post) => post.id !== id) })),
  setPosts: (posts) => set({ posts }),
  // Adds the next page, skipping anything already shown
  appendPosts: (newPosts) =>
    set((state) => {
      const seen = new Set(state.posts.map((post) => post.id));
      return { posts: [...state.posts, ...newPosts.filter((p) => !seen.has(p.id))] };
    }),
  addComment: (postId, comment) =>
    set((state) => ({
      posts: state.posts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...post.comments, comment],
          };
        }
        return post;
      }),
    })),
}));

export default usePostStore;
