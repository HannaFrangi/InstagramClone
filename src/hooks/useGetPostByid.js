import { useState } from "react";
import useShowToast from "./useShowToast";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "../firebase/firebaseConfig";

const useGetPostByid = () => {
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const showToast = useShowToast();

  const getPostbyId = async (postId) => {
    setIsLoading(true);
    try {
      const docRef = doc(firestore, "posts", postId);
      const postDoc = await getDoc(docRef);

      if (!postDoc.exists()) {
        showToast("Error", "Post not found", "error");
      } else {
        setPost(postDoc.data());
      }
    } catch (error) {
      console.log(error.message);
      showToast("Error", error.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, post, getPostbyId };
};

export default useGetPostByid;
