import { useEffect, useState } from "react";
import { collection, documentId, getDocs, query, where } from "firebase/firestore";
import { firestore } from "../firebase/firebaseConfig";
import useShowToast from "./useShowToast";

const toPosts = (snapshot) => snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

// Fetches `load()` once per `key`; loading is derived from which key the
// current result belongs to
const useFetchOnce = (key, load) => {
  const [result, setResult] = useState({ forKey: null, posts: [] });
  const showToast = useShowToast();

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    load()
      .then((posts) => !cancelled && setResult({ forKey: key, posts }))
      .catch((error) => {
        showToast("Error", error.message, "error");
        if (!cancelled) setResult({ forKey: key, posts: [] });
      });
    return () => {
      cancelled = true;
    };
    // `load` is recreated every render; `key` captures everything it depends on
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, showToast]);

  return { isLoading: !!key && result.forKey !== key, posts: result.posts };
};

// Saved posts, most recently saved first. Only the ids fetched so far are
// loaded; unsaving hides a post immediately without refetching.
export const useGetSavedPosts = (postIds) => {
  const [fetchedIds, setFetchedIds] = useState(null);
  // Refetch only when a post was saved that we haven't loaded yet
  const needsFetch = !fetchedIds || postIds.some((id) => !fetchedIds.includes(id));
  if (needsFetch && fetchedIds !== postIds) setFetchedIds(postIds);
  const key = fetchedIds && fetchedIds.length > 0 ? fetchedIds.join(",") : null;

  const { isLoading, posts } = useFetchOnce(key, async () => {
    const chunks = [];
    // Firestore "in" queries accept at most 30 values
    for (let i = 0; i < fetchedIds.length; i += 30) {
      chunks.push(fetchedIds.slice(i, i + 30));
    }
    const snapshots = await Promise.all(
      chunks.map((ids) =>
        getDocs(query(collection(firestore, "posts"), where(documentId(), "in", ids)))
      )
    );
    return snapshots.flatMap(toPosts);
  });

  const byId = new Map(posts.map((post) => [post.id, post]));
  const savedPosts = [...postIds]
    .reverse()
    .map((id) => byId.get(id))
    .filter(Boolean); // deleted posts just drop out
  return { isLoading, posts: savedPosts };
};

// Posts the user has liked, newest post first
export const useGetLikedPosts = (uid) =>
  useFetchOnce(uid, async () => {
    const snapshot = await getDocs(
      query(collection(firestore, "posts"), where("likes", "array-contains", uid))
    );
    return toPosts(snapshot).sort((a, b) => b.createdAt - a.createdAt);
  });
