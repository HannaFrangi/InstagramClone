import { useState, useEffect } from "react";
import { firestore } from "../firebase/firebaseConfig";
import {
  onSnapshot,
  collection,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import useAuthStore from "../store/authStore";
import useShowToast from "./useShowToast";

const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const authUser = useAuthStore((state) => state.user);
  const showToast = useShowToast();

  useEffect(() => {
    if (!authUser) return;

    const q = query(
      collection(firestore, "notifications"),
      where("receiverId", "==", authUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedNotifications = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications(fetchedNotifications);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching notifications: ", error);
        showToast("Error", "Failed to fetch notifications", "error");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authUser, showToast]);

  const markAsRead = async (notificationId) => {
    try {
      const notifRef = doc(firestore, "notifications", notificationId);
      await updateDoc(notifRef, { isRead: true });
      showToast("Success", "Notification marked as read", "success");
    } catch (error) {
      console.error("Error marking notification as read: ", error);
      showToast("Error", "Failed to mark notification as read", "error");
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await deleteDoc(doc(firestore, "notifications", notificationId));
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error("Error deleting notification: ", error);
      showToast("error", error.message, "error");
    }
  };

  return { notifications, loading, markAsRead, deleteNotification };
};

export default useNotifications;
