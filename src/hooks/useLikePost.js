import {
  arrayRemove,
  arrayUnion,
  doc,
  updateDoc,
  collection,
  addDoc,
} from "firebase/firestore";
import useAuthStore from "../store/authStore";
import useShowToast from "./useShowToast";
import { firestore } from "../firebase/firebaseConfig";
import { useEffect, useState } from "react";

// Function to create a notification, takes showToast as an argument
const createNotification = async (
  receiverId,
  senderId,
  type,
  postId,
  showToast
) => {
  try {
    const notificationRef = collection(firestore, "notifications");

    await addDoc(notificationRef, {
      receiverId,
      senderId,
      type,
      postId,
      isRead: false,
      createdAt: new Date(),
    });
    // showToast("Success", "Notification created!", "success");
  } catch (error) {
    console.error("Error creating notification: ", error);
    showToast("Error", error.message, "error");
  }
};

const useLikePost = (post) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const authUser = useAuthStore((state) => state.user);
  const [likes, setLikes] = useState(post.likes.length);
  const [isLiked, setIsLiked] = useState(post.likes.includes(authUser?.uid));
  const showToast = useShowToast();

  useEffect(() => {
    if (authUser && post.likes.includes(authUser.uid)) {
      setIsLiked(true);
    }
  }, [authUser, post.likes]);

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
        await createNotification(
          post.createdBy,
          authUser.uid,
          "like",
          post.id,
          showToast
        );
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
