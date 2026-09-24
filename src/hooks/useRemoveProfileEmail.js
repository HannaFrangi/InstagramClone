import { useEffect } from "react";
import { deleteField, doc, updateDoc } from "firebase/firestore";
import { firestore } from "../firebase/firebaseConfig";
import useAuthStore from "../store/authStore";

// Profiles used to store the user's email, which every signed-in user can
// read. When someone with an old profile uses the app, remove it once.
const useRemoveProfileEmail = () => {
  const authUser = useAuthStore((state) => state.user);
  const setAuthUser = useAuthStore((state) => state.setUser);
  const uid = authUser?.uid;
  const hasEmail = !!authUser && "email" in authUser;

  useEffect(() => {
    if (!uid || !hasEmail) return;
    updateDoc(doc(firestore, "users", uid), { email: deleteField() })
      .then(() => {
        const rest = { ...useAuthStore.getState().user };
        delete rest.email;
        setAuthUser(rest);
        localStorage.setItem("user-info", JSON.stringify(rest));
      })
      .catch(console.error);
  }, [uid, hasEmail, setAuthUser]);
};

export default useRemoveProfileEmail;
