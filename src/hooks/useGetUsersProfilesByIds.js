import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "../firebase/firebaseConfig";
import useShowToast from "./useShowToast";

const useGetUserProfilesByIds = (userIds) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState([]);
  const showToast = useShowToast();

  useEffect(() => {
    const fetchUserProfiles = async () => {
      setIsLoading(true);
      const profiles = [];
      try {
        for (const userId of userIds) {
          const userRef = await getDoc(doc(firestore, "users", userId));
          if (userRef.exists()) {
            profiles.push({ uid: userId, ...userRef.data() });
          }
        }
        setUserProfiles(profiles);
      } catch (error) {
        console.error(error.message);
        showToast("Error", error.message, "error");
      } finally {
        setIsLoading(false);
      }
    };

    if (userIds.length) {
      fetchUserProfiles();
    }
  }, [userIds, showToast]);

  return { isLoading, userProfiles };
};

export default useGetUserProfilesByIds;
