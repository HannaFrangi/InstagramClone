import { useEffect, useState } from "react";
import useShowToast from "./useShowToast";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firestore } from "../firebase/firebaseConfig.js";
import useUserProfileStore from "../store/userProfileStore.js";

const useGetUserProfileByUsername = (username) => {
  const [loadedUsername, setLoadedUsername] = useState(null);
  const showToast = useShowToast();
  const { userProfile, setUserProfile } = useUserProfileStore();
  const isLoading = !!username && loadedUsername !== username;

  useEffect(() => {
    if (!username) {
      setUserProfile(null);
      return;
    }

    const getUserProfile = async () => {
      try {
        const q = query(
          collection(firestore, "users"),
          where("username", "==", username)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setUserProfile(null);
          return;
        }

        let userDoc;
        querySnapshot.forEach((doc) => {
          userDoc = doc.data();
        });

        setUserProfile(userDoc);
      } catch (error) {
        console.error(error);
        showToast("Error", error.message, "error");
      } finally {
        setLoadedUsername(username);
      }
    };

    getUserProfile();
  }, [setUserProfile, username, showToast]);

  return { isLoading, userProfile };
};

export default useGetUserProfileByUsername;
