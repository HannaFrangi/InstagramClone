import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import useAuthStore from "../store/authStore";
import useShowToast from "./useShowToast";
import { firestore } from "../firebase/firebaseConfig";
import { useEffect, useState } from "react";

const useGetSuggestedUsers = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const authUser = useAuthStore((state) => state.user);
  const showToast = useShowToast();

  useEffect(() => {
    setIsLoading(true);
    const getSuggestedUsers = async () => {
      try {
        const userRef = collection(firestore, "users");

        const q = query(
          userRef,
          where("uid", "not-in", [authUser.uid, ...authUser.Following]),
          orderBy("uid"),
          limit(3)
        );

        const querySnapshot = await getDocs(q);

        const users = [];
        querySnapshot.forEach((doc) => {
          users.push({ ...doc.data(), id: doc.id });
        });

        setSuggestedUsers(users);
      } catch (error) {
        showToast("error", error.message, "error");
      } finally {
        setIsLoading(false);
      }
    };

    if (authUser) {
      getSuggestedUsers();
    }
  }, [authUser, showToast]);

  return { suggestedUsers, isLoading };
};

export default useGetSuggestedUsers;
