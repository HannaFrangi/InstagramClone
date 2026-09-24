import { useEffect, useState } from "react";
import useShowToast from "./useShowToast";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "../firebase/firebaseConfig";

// Profiles are shared across every post, comment and notification on screen,
// so fetch each user once per session instead of once per component.
const profileCache = new Map();

const fetchUserProfile = (userId) => {
  if (!profileCache.has(userId)) {
    const request = getDoc(doc(firestore, "users", userId))
      .then((snap) => (snap.exists() ? snap.data() : null))
      .catch((error) => {
        profileCache.delete(userId);
        throw error;
      });
    profileCache.set(userId, request);
  }
  return profileCache.get(userId);
};

export const setCachedUserProfile = (userId, profile) => {
  profileCache.set(userId, Promise.resolve(profile));
};

const useGetUserProfileById = (userId) => {
  const [result, setResult] = useState({ forId: null, profile: null });
  const showToast = useShowToast();
  const isLoading = !!userId && result.forId !== userId;
  const userProfile = result.forId === userId ? result.profile : null;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    fetchUserProfile(userId)
      .then((profile) => {
        if (!cancelled) setResult({ forId: userId, profile });
      })
      .catch((error) => {
        console.error(error);
        showToast("Error", error.message, "error");
        if (!cancelled) setResult({ forId: userId, profile: null });
      });

    return () => {
      cancelled = true;
    };
  }, [userId, showToast]);

  return { isLoading, userProfile };
};

export default useGetUserProfileById;
