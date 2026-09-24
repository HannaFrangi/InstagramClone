import { useState, useEffect } from 'react';
import { firestore } from '../firebase/firebaseConfig';
import {
  onSnapshot,
  collection,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import useAuthStore from '../store/authStore';
import useShowToast from './useShowToast';

const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const authUser = useAuthStore((state) => state.user);
  const showToast = useShowToast();

  useEffect(() => {
    if (!authUser) return;

    const q = query(
      collection(firestore, 'notifications'),
      where('receiverId', '==', authUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedNotifications = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(
            (notification) => notification.senderId !== notification.receiverId
          )
          // Newest first; createdAt is a Firestore Timestamp
          .sort(
            (a, b) =>
              (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
          );

        setNotifications(fetchedNotifications);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching notifications: ', error);
        showToast('Error', 'Failed to fetch notifications', 'error');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authUser, showToast]);

  const markAsRead = async (notificationId) => {
    try {
      const notifRef = doc(firestore, 'notifications', notificationId);
      await updateDoc(notifRef, { isRead: true });
      showToast('Success', 'Notification marked as read', 'success');
    } catch (error) {
      console.error('Error marking notification as read: ', error);
      showToast('Error', 'Failed to mark notification as read', 'error');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await deleteDoc(doc(firestore, 'notifications', notificationId));
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification: ', error);
      showToast('error', error.message, 'error');
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length === 0) return;
    try {
      const batch = writeBatch(firestore);
      unread.forEach((n) =>
        batch.update(doc(firestore, 'notifications', n.id), { isRead: true })
      );
      await batch.commit();
    } catch (error) {
      console.error('Error marking notifications as read: ', error);
    }
  };

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};

export default useNotifications;
