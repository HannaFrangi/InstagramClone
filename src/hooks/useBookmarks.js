import { useEffect, useState } from "react";
import { arrayRemove, arrayUnion, doc, onSnapshot, setDoc } from "firebase/firestore";
import { firestore } from "../firebase/firebaseConfig";
import useBookmarkStore from "../store/bookmarkStore";
import useShowToast from "./useShowToast";

// Call once near the app root: keeps the bookmark store in sync with Firestore
export const useBookmarksSync = (uid) => {
  const setPostIds = useBookmarkStore((state) => state.setPostIds);

  useEffect(() => {
    if (!uid) {
      setPostIds([]);
      return;
    }
    return onSnapshot(
      doc(firestore, "bookmarks", uid),
      (snap) => setPostIds(snap.data()?.postIds ?? []),
      (error) => console.error("Error loading bookmarks: ", error)
    );
  }, [uid, setPostIds]);
};

// Save / unsave one post for the signed-in user
const useBookmark = (postId, uid) => {
  const isSaved = useBookmarkStore((state) => state.postIds.includes(postId));
  const [isUpdating, setIsUpdating] = useState(false);
  const showToast = useShowToast();

  const toggleBookmark = async () => {
    if (isUpdating || !uid) return;
    setIsUpdating(true);
    try {
      await setDoc(
        doc(firestore, "bookmarks", uid),
        { postIds: isSaved ? arrayRemove(postId) : arrayUnion(postId) },
        { merge: true }
      );
    } catch (error) {
      showToast("Error", error.message, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  return { isSaved, isUpdating, toggleBookmark };
};

export default useBookmark;
