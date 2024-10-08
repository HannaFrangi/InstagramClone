import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";
import useAuthStore from "../store/authStore";
import useShowToast from "./useShowToast";
import { firestore } from "../firebase/firebaseConfig";
import { useEffect, useState } from "react";

const useLikePost = (post) => {
  const [isupdtating, setIsUpdtating] = useState(false);
  const authUser = useAuthStore((state) => state.user);
  const [likes, setLikes] = useState(post.likes.length);
  const [isLiked, setIsLiked] = useState(post.likes.includes(authUser?.id));
  const showToast = useShowToast();

  useEffect(() => {
    if (authUser && post.likes.includes(authUser.uid)) {
      setIsLiked(true);
    }
  }, [authUser, post.likes]);

  const handleLikePost = async () => {
    if (isupdtating) return;
    if (!authUser)
      return showToast("Error", "You must be logged in To comment");
    setIsUpdtating(true);
    try {
      const postRef = doc(firestore, "posts", post.id);
      await updateDoc(postRef, {
        likes: isLiked ? arrayRemove(authUser.uid) : arrayUnion(authUser.uid),
      });
      setIsLiked(!isLiked);
      isLiked ? setLikes(likes - 1) : setLikes(likes + 1);
    } catch (error) {
      showToast("Error", error.message, "error");
    } finally {
      setIsUpdtating(false);
    }
  };
  return { isLiked, isupdtating, handleLikePost, likes };
};

export default useLikePost;
