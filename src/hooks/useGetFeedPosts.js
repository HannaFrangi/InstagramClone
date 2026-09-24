import { useEffect, useState } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import usePostStore from '../store/postStore';
import useAuthStore from '../store/authStore';
import useShowToast from './useShowToast';
import { firestore } from '../firebase/firebaseConfig';

const useGetFeedPosts = () => {
  const [refreshCount, setRefreshCount] = useState(0);
  const [loadedCount, setLoadedCount] = useState(-1);
  const [error, setError] = useState(null); // Error state
  const { posts, setPosts } = usePostStore();
  const authUser = useAuthStore((state) => state.user);
  const showToast = useShowToast();
  const hasFollowing = !!authUser?.Following?.length;
  const isLoading = hasFollowing && loadedCount !== refreshCount;

  useEffect(() => {
    if (!authUser) return;

    if (!hasFollowing) {
      showToast(
        'Warning',
        'You are not following anyone. Follow someone to see posts!',
        'warning'
      );
      setPosts([]);
      return;
    }

    // Query posts created by followed users
    const q = query(
      collection(firestore, 'posts')
      // where('createdBy', 'in', authUser.Following)
    );

    // Real-time listener for posts collection
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const feedPosts = [];

        snapshot.forEach((doc) => {
          feedPosts.push({ id: doc.id, ...doc.data() });
        });

        // Sort posts by creation date
        feedPosts.sort((a, b) => b.createdAt - a.createdAt);
        setPosts(feedPosts);
        setError(null);
        setLoadedCount(refreshCount);
      },
      (err) => {
        setError(err.message);
        showToast('Error', err.message, 'error');
        setLoadedCount(refreshCount);
      }
    );

    return unsubscribe;
  }, [authUser, hasFollowing, refreshCount, setPosts, showToast]);

  const refresh = () => setRefreshCount((count) => count + 1);

  return { isLoading, posts, error, refresh };
};

export default useGetFeedPosts;
