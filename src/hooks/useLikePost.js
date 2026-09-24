import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";
import useAuthStore from "../store/authStore";
import useShowToast from "./useShowToast";
import { firestore } from "../firebase/firebaseConfig";
import { useState } from "react";
import { createNotification } from "../utils/notifications";

const useLikePost = (post) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const authUser = useAuthStore((state) => state.user);
  const [likes, setLikes] = useState(post.likes.length);
  const [isLiked, setIsLiked] = useState(post.likes.includes(authUser?.uid));
  const showToast = useShowToast();

  // Resync local state when the post's likes or the logged-in user change
  const [synced, setSynced] = useState({ likes: post.likes, uid: authUser?.uid });
  if (synced.likes !== post.likes || synced.uid !== authUser?.uid) {
    setSynced({ likes: post.likes, uid: authUser?.uid });
    setLikes(post.likes.length);
    setIsLiked(post.likes.includes(authUser?.uid));
  }

  const handleLikePost = async () => {
    if (isUpdating) return;
    if (!authUser) {
      return showToast("Error", "You must be logged in to like a post");
    }
    setIsUpdating(true);
    try {
      const postRef = doc(firestore, "posts", post.id);
      await updateDoc(postRef, {
        likes: isLiked ? arrayRemove(authUser.uid) : arrayUnion(authUser.uid),
      });

      // Create notification only when a post is liked
      if (!isLiked) {
        await createNotification({
          receiverId: post.createdBy,
          senderId: authUser.uid,
          type: "like",
          postId: post.id,
        }).catch((error) => console.error("Error creating notification: ", error));
      }

      // Update local state
      setIsLiked(!isLiked);
      setLikes(isLiked ? likes - 1 : likes + 1);
    } catch (error) {
      showToast("Error", error.message, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  return { isLiked, isUpdating, handleLikePost, likes };
};

export default useLikePost;
