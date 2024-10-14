import { useEffect, useState } from "react";
import usePostStore from "../store/postStore";
import useAuthStore from "../store/authStore";
import useShowToast from "./useShowToast";
import useUserProfileStore from "../store/userProfileStore";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firestore } from "../firebase/firebaseConfig";

const useGetFeedPosts = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null); // New state for error
  const { posts, setPosts } = usePostStore();
  const authUser = useAuthStore((state) => state.user);
  const showToast = useShowToast();
  const { setUserProfile } = useUserProfileStore();

  const getFeedPosts = async () => {
    setIsLoading(true);
    setError(null); // Reset error on each fetch attempt

    // if (authUser.Following.length === 0) {
    //   setIsLoading(false);
    //   setPosts([]);
    //   return;
    // }

    if (authUser.Following.length === 0) {
      setIsLoading(false);
      showToast(
        "Warning",
        "You are not following anyone ,Follow Someone!",
        "warning"
      );
    }

    const q = query(
      collection(firestore, "posts")
      // where("createdBy", "in", authUser.Following)
    );

    try {
      const querySnapshot = await getDocs(q);
      const feedPosts = [];

      querySnapshot.forEach((doc) => {
        feedPosts.push({ id: doc.id, ...doc.data() });
      });

      feedPosts.sort((a, b) => b.createdAt - a.createdAt);
      setPosts(feedPosts);
    } catch (err) {
      setError(err.message); // Set the error state
      showToast("Error", err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authUser) getFeedPosts();
  }, [authUser, showToast, setPosts, setUserProfile]);

  const refresh = () => {
    getFeedPosts(); // Call the fetch function to refresh posts
  };

  return { isLoading, posts, error, refresh }; // Return error and refresh
};

export default useGetFeedPosts;
