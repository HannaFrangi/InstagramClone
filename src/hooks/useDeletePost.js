import { useState } from "react";
import {
  arrayRemove,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { firestore, storage } from "../firebase/firebaseConfig";
import useAuthStore from "../store/authStore";
import usePostStore from "../store/postStore";
import useUserProfileStore from "../store/userProfileStore";
import useShowToast from "./useShowToast";

const useDeletePost = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const authUser = useAuthStore((state) => state.user);
  const removeFromPosts = usePostStore((state) => state.deletePost);
  const removeFromProfile = useUserProfileStore((state) => state.deletePost);
  const showToast = useShowToast();

  // Returns true when the post was deleted
  const deletePost = async (post, { confirm = true } = {}) => {
    if (isDeleting || !authUser || post.createdBy !== authUser.uid) return false;
    if (confirm && !window.confirm("Are you sure you want to delete this post?"))
      return false;

    setIsDeleting(true);
    try {
      if (post.imageURL) {
        await deleteObject(ref(storage, `posts/${post.id}`));
      }
      await deleteDoc(doc(firestore, "posts", post.id));
      await updateDoc(doc(firestore, "users", authUser.uid), {
        posts: arrayRemove(post.id),
      });

      // Undoing a plain repost also takes it off the original's count
      if (post.repostOf && !post.caption) {
        await updateDoc(doc(firestore, "posts", post.repostOf), {
          reposts: arrayRemove(authUser.uid),
        }).catch(() => {}); // the original may already be gone
      }

      // Security rules only allow reading notifications you sent or received,
      // so each query has to say which side of it you're on
      const notificationsRef = collection(firestore, "notifications");
      const me = authUser.uid;
      const snapshots = await Promise.all([
        getDocs(query(notificationsRef, where("postId", "==", post.id), where("receiverId", "==", me))),
        getDocs(query(notificationsRef, where("postId", "==", post.id), where("senderId", "==", me))),
        getDocs(query(notificationsRef, where("sourcePostId", "==", post.id), where("senderId", "==", me))),
      ]);
      const batch = writeBatch(firestore);
      snapshots.forEach((snap) => snap.forEach((docSnap) => batch.delete(docSnap.ref)));
      await batch.commit();

      removeFromPosts(post.id);
      if (useUserProfileStore.getState().userProfile?.uid === authUser.uid) {
        removeFromProfile(post.id);
      }
      return true;
    } catch (error) {
      showToast("Error", error.message, "error");
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return { isDeleting, deletePost };
};

export default useDeletePost;
