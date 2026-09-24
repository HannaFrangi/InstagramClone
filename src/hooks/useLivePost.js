import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { firestore } from "../firebase/firebaseConfig";

// Subscribes to a single post so likes, comments and reposts stay current.
// `post` is null once loaded if the post doesn't exist (e.g. it was deleted).
const useLivePost = (postId) => {
  const [result, setResult] = useState({ forId: null, post: null });
  const isLoading = !!postId && result.forId !== postId;
  const post = result.forId === postId ? result.post : null;

  useEffect(() => {
    if (!postId) return;
    return onSnapshot(
      doc(firestore, "posts", postId),
      (snap) =>
        setResult({
          forId: postId,
          post: snap.exists() ? { id: snap.id, ...snap.data() } : null,
        }),
      () => setResult({ forId: postId, post: null })
    );
  }, [postId]);

  return { isLoading, post };
};

export default useLivePost;
