import { useEffect, useRef, useState } from 'react';
import usePostStore from '../store/postStore';
import useAuthStore from '../store/authStore';
import useShowToast from './useShowToast';
import { createFeedCursor } from '../utils/feedCursor';

// Feed of posts by the people you follow plus your own, loaded a page at a
// time. New posts from others show up on refresh; your own actions (posting,
// commenting, deleting) update the loaded posts in place via the post store.
const useGetFeedPosts = () => {
  const [refreshCount, setRefreshCount] = useState(0);
  const [status, setStatus] = useState({ forKey: null, hasMore: false, error: null });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const cursorRef = useRef(null);
  const { posts, setPosts, appendPosts } = usePostStore();
  const authUser = useAuthStore((state) => state.user);
  const showToast = useShowToast();

  const authorIds = authUser
    ? [...new Set([authUser.uid, ...(authUser.Following ?? [])])]
    : [];
  // Reload when the set of followed people changes or on refresh
  const feedKey = authUser ? `${authorIds.join(',')}#${refreshCount}` : null;
  const isLoading = !!feedKey && status.forKey !== feedKey;

  useEffect(() => {
    if (!feedKey) return;
    const cursor = createFeedCursor(feedKey.split('#')[0].split(','));
    cursorRef.current = cursor;

    cursor
      .nextPage()
      .then(({ posts: page, hasMore }) => {
        if (cursorRef.current !== cursor) return; // a newer load replaced this one
        setPosts(page);
        setStatus({ forKey: feedKey, hasMore, error: null });
      })
      .catch((error) => {
        if (cursorRef.current !== cursor) return;
        console.error(error); // a missing-index error includes the link to create it
        showToast('Error', error.message, 'error');
        setPosts([]);
        setStatus({ forKey: feedKey, hasMore: false, error: error.message });
      });
  }, [feedKey, setPosts, showToast]);

  const loadMore = async () => {
    const cursor = cursorRef.current;
    if (!cursor || isLoading || isLoadingMore || !status.hasMore) return;
    setIsLoadingMore(true);
    try {
      const { posts: page, hasMore } = await cursor.nextPage();
      if (cursorRef.current !== cursor) return;
      appendPosts(page);
      setStatus((prev) => ({ ...prev, hasMore }));
    } catch (error) {
      showToast('Error', error.message, 'error');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const refresh = () => setRefreshCount((count) => count + 1);

  return {
    isLoading,
    isLoadingMore,
    hasMore: status.hasMore,
    posts,
    error: status.error,
    loadMore,
    refresh,
  };
};

export default useGetFeedPosts;
