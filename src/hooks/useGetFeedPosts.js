import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import usePostStore from '../store/postStore';
import useAuthStore from '../store/authStore';
import useShowToast from './useShowToast';
import useUserProfileStore from '../store/userProfileStore';
import { firestore } from '../firebase/firebaseConfig';

const useGetFeedPosts = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null); // Error state
  const { posts, setPosts } = usePostStore();
  const authUser = useAuthStore((state) => state.user);
  const showToast = useShowToast();
  const { setUserProfile } = useUserProfileStore();

  const getFeedPosts = () => {
    setIsLoading(true);
    setError(null); // Reset error on each fetch attempt

    if (!authUser.Following || authUser.Following.length === 0) {
      setIsLoading(false);
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
        if (snapshot.empty) {
          console.log('No posts found.');
          setPosts([]);
          setIsLoading(false);
          return;
        }

        const feedPosts = [];

        snapshot.forEach((doc) => {
          feedPosts.push({ id: doc.id, ...doc.data() });
        });

        // Sort posts by creation date
        feedPosts.sort((a, b) => b.createdAt - a.createdAt);
        setPosts(feedPosts);
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        showToast('Error', err.message, 'error');
        setIsLoading(false);
      }
    );

    return unsubscribe;
  };

  useEffect(() => {
    if (!authUser) return;

    const unsubscribe = getFeedPosts();

    return () => unsubscribe && unsubscribe();
  }, [authUser, setPosts, showToast]);

  const refresh = () => {
    setIsLoading(true);
    getFeedPosts();
  };

  return { isLoading, posts, error, refresh };
};

export default useGetFeedPosts;
