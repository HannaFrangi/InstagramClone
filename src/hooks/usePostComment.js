import { useState } from "react";
import useShowToast from "./useShowToast";
import useAuthStore from "../store/authStore";
import { arrayUnion, doc, updateDoc } from "firebase/firestore";
import { firestore } from "../firebase/firebaseConfig";
import { createNotification, notifyMentions } from "../utils/notifications";
import usePostStore from "../store/postStore";

const usePostComment = () => {
  const [isCommenting, setIsCommenting] = useState(false);
  const showToast = useShowToast();
  const authUser = useAuthStore((state) => state.user);
  const addComment = usePostStore((state) => state.addComment);

  const handlePostComment = async (post, comment) => {
    const postId = post.id;
    if (isCommenting) return;

    if (!authUser)
      return showToast("Error", "You must be Logged in to Comment", "error");

    const newComment = {
      comment: comment,
      createdAt: Date.now(),
      createdBy: authUser.uid,
      postId,
    };

    setIsCommenting(true);

    try {
      await updateDoc(doc(firestore, "posts", postId), {
        comments: arrayUnion(newComment),
      });
      // The comment is saved either way; a failed notification is not fatal
      createNotification({
        receiverId: post.createdBy,
        senderId: authUser.uid,
        type: "comment",
        postId,
      }).catch(console.error);
      notifyMentions({ text: comment, senderId: authUser.uid, postId }).catch(
        console.error
      );
      addComment(postId, newComment);
    } catch (error) {
      showToast("Error", error.message, "error");
    } finally {
      setIsCommenting(false);
    }
  };

  return { isCommenting, handlePostComment };
};

export default usePostComment;
