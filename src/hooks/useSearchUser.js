import { useState } from "react";
import useShowToast from "./useShowToast";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  startAt,
  endAt,
} from "firebase/firestore";
import { firestore } from "../firebase/firebaseConfig";

const useSearchUser = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const showToast = useShowToast();

  const getUserProfile = async (username) => {
    setIsLoading(true);
    setUsers([]);
    try {
      const q = query(
        collection(firestore, "users"),
        orderBy("username"),
        startAt(username),
        endAt(username + "\uf8ff") // This helps to fetch usernames starting with the input
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return showToast("Error", "No users found", "error");
      }

      const foundUsers = [];
      querySnapshot.forEach((doc) => {
        foundUsers.push(doc.data());
      });

      setUsers(foundUsers);
    } catch (error) {
      showToast("Error", error.message, "error");
      setUsers([]);
    } finally {
      setIsLoading(false);
      document.title = "Home";
    }
  };

  return { isLoading, getUserProfile, users, setUsers };
};

export default useSearchUser;
