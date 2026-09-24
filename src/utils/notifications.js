import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { firestore } from "../firebase/firebaseConfig";
import { extractMentions } from "./postText";

// type: "like" | "mention" | "repost" | "quote" | "comment" | "follow"
// postId is the post the notification opens; sourcePostId (optional) is the
// repost/quote that triggered it, so deleting that post clears it too.
export const createNotification = async ({
  receiverId,
  senderId,
  type,
  postId,
  sourcePostId = null,
}) => {
  if (!receiverId || receiverId === senderId) return;
  await addDoc(collection(firestore, "notifications"), {
    receiverId,
    senderId,
    type,
    postId,
    sourcePostId,
    isRead: false,
    createdAt: new Date(),
  });
};

// Sends a "mention" notification to every existing user @mentioned in `text`
export const notifyMentions = async ({ text, senderId, postId }) => {
  // Firestore "in" queries accept at most 30 values
  const usernames = extractMentions(text).slice(0, 30);
  if (usernames.length === 0) return;

  const snapshot = await getDocs(
    query(collection(firestore, "users"), where("username", "in", usernames))
  );
  await Promise.all(
    snapshot.docs.map((userDoc) =>
      createNotification({
        receiverId: userDoc.id,
        senderId,
        type: "mention",
        postId,
      })
    )
  );
};

// Unfollowing takes back the "started following you" notification, so
// following and unfollowing repeatedly doesn't spam the other person
export const removeFollowNotification = async ({ receiverId, senderId }) => {
  const snapshot = await getDocs(
    query(
      collection(firestore, "notifications"),
      where("senderId", "==", senderId),
      where("receiverId", "==", receiverId),
      where("type", "==", "follow")
    )
  );
  const batch = writeBatch(firestore);
  snapshot.forEach((docSnap) => batch.delete(docSnap.ref));
  await batch.commit();
};
