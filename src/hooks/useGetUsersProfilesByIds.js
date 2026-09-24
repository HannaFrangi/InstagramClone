import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "../firebase/firebaseConfig";
import useShowToast from "./useShowToast";

const useGetUserProfilesByIds = (userIds) => {
  const [result, setResult] = useState({ forIds: null, profiles: [] });
  const showToast = useShowToast();
  const isLoading = userIds.length > 0 && result.forIds !== userIds;
  const userProfiles = userIds.length > 0 ? result.profiles : [];

  useEffect(() => {
    const fetchUserProfiles = async () => {
      const profiles = [];
      try {
        for (const userId of userIds) {
          const userRef = await getDoc(doc(firestore, "users", userId));
          if (userRef.exists()) {
            profiles.push({ uid: userId, ...userRef.data() });
          }
        }
      } catch (error) {
        console.error(error.message);
        showToast("Error", error.message, "error");
      } finally {
        setResult({ forIds: userIds, profiles });
      }
    };

    if (userIds.length) {
      fetchUserProfiles();
    }
  }, [userIds, showToast]);

  return { isLoading, userProfiles };
};

export default useGetUserProfilesByIds;
