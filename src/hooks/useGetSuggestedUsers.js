import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";
import useAuthStore from "../store/authStore";
import useShowToast from "./useShowToast";
import { firestore } from "../firebase/firebaseConfig";
import { useEffect, useState } from "react";

const useGetSuggestedUsers = () => {
  const [result, setResult] = useState({ forUser: null, users: [] });
  const authUser = useAuthStore((state) => state.user);
  const showToast = useShowToast();
  const isLoading = result.forUser !== authUser;
  const suggestedUsers = result.users;

  useEffect(() => {
    const getSuggestedUsers = async () => {
      try {
        // "not-in" only accepts 10 values, so instead fetch enough profiles
        // that at least 3 remain after dropping yourself and everyone you
        // already follow
        const excluded = new Set([authUser.uid, ...(authUser.Following ?? [])]);
        const q = query(
          collection(firestore, "users"),
          orderBy("uid"),
          limit(excluded.size + 3)
        );

        const querySnapshot = await getDocs(q);

        const users = querySnapshot.docs
          .filter((doc) => !excluded.has(doc.id))
          .slice(0, 3)
          .map((doc) => ({ ...doc.data(), id: doc.id }));

        setResult({ forUser: authUser, users });
      } catch (error) {
        showToast("error", error.message, "error");
        setResult({ forUser: authUser, users: [] });
      }
    };

    if (authUser) {
      getSuggestedUsers();
    }
  }, [authUser, showToast]);

  return { suggestedUsers, isLoading };
};

export default useGetSuggestedUsers;
