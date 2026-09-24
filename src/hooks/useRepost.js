import { useState } from "react";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { firestore } from "../firebase/firebaseConfig";
import useAuthStore from "../store/authStore";
import useUserProfileStore from "../store/userProfileStore";
import useShowToast from "./useShowToast";
import useDeletePost from "./useDeletePost";
import { createNotification, notifyMentions } from "../utils/notifications";
import { extractHashtags } from "../utils/postText";

// `post` is always the original being reposted or quoted, never a plain repost
const useRepost = (post) => {
  const [isReposting, setIsReposting] = useState(false);
  const authUser = useAuthStore((state) => state.user);
  const addPostToProfile = useUserProfileStore((state) => state.addPost);
  const { deletePost } = useDeletePost();
  const showToast = useShowToast();
  // Local result of the last toggle, dropped once fresh post data arrives
  // (profile lists aren't live, so without this the button would lag behind)
  const [override, setOverride] = useState({ forReposts: post?.reposts, value: null });
  if (override.forReposts !== post?.reposts) {
    setOverride({ forReposts: post?.reposts, value: null });
  }
  const repostedOnServer = !!authUser && !!post?.reposts?.includes(authUser.uid);
  const hasReposted = override.value ?? repostedOnServer;
  const repostCount =
    (post?.reposts?.length ?? 0) + (hasReposted === repostedOnServer ? 0 : hasReposted ? 1 : -1);

  const addRepostDoc = async (caption) => {
    const newPost = {
      caption,
      hashtags: extractHashtags(caption),
      repostOf: post.id,
      likes: [],
      comments: [],
      reposts: [],
      createdAt: Date.now(),
      createdBy: authUser.uid,
    };
    const postDocRef = await addDoc(collection(firestore, "posts"), newPost);
    await updateDoc(doc(firestore, "users", authUser.uid), {
      posts: arrayUnion(postDocRef.id),
    });
    if (useUserProfileStore.getState().userProfile?.uid === authUser.uid) {
      addPostToProfile({ ...newPost, id: postDocRef.id });
    }
    return postDocRef.id;
  };

  const run = async (action) => {
    if (isReposting) return false;
    if (!authUser) {
      showToast("Error", "You must be logged in", "error");
      return false;
    }
    setIsReposting(true);
    try {
      await action();
      return true;
    } catch (error) {
      showToast("Error", error.message, "error");
      return false;
    } finally {
      setIsReposting(false);
    }
  };

  const toggleRepost = () =>
    run(async () => {
      if (hasReposted) {
        const snapshot = await getDocs(
          query(
            collection(firestore, "posts"),
            where("repostOf", "==", post.id),
            where("createdBy", "==", authUser.uid)
          )
        );
        const plainRepost = snapshot.docs.find((d) => !d.data().caption);
        if (plainRepost) {
          await deletePost(
            { id: plainRepost.id, ...plainRepost.data() },
            { confirm: false }
          );
        } else {
          await updateDoc(doc(firestore, "posts", post.id), {
            reposts: arrayRemove(authUser.uid),
          });
        }
        setOverride({ forReposts: post.reposts, value: false });
        return;
      }

      const repostId = await addRepostDoc("");
      await updateDoc(doc(firestore, "posts", post.id), {
        reposts: arrayUnion(authUser.uid),
      });
      setOverride({ forReposts: post.reposts, value: true });
      await createNotification({
        receiverId: post.createdBy,
        senderId: authUser.uid,
        type: "repost",
        postId: post.id,
        sourcePostId: repostId,
      });
    });

  const quotePost = (text) =>
    run(async () => {
      const caption = text.trim();
      if (!caption) throw new Error("Add something to your quote");
      const quoteId = await addRepostDoc(caption);
      await createNotification({
        receiverId: post.createdBy,
        senderId: authUser.uid,
        type: "quote",
        postId: quoteId,
      });
      await notifyMentions({ text: caption, senderId: authUser.uid, postId: quoteId });
      showToast("Success", "Quote posted", "success");
    });

  return { isReposting, hasReposted, repostCount, toggleRepost, quotePost };
};

export default useRepost;
