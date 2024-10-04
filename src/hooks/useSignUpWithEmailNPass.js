import { useState } from "react";
import { useCreateUserWithEmailAndPassword } from "react-firebase-hooks/auth";
import { firestore, auth } from "../firebase/firebaseConfig";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import useShowToast from "./useShowToast";
import useAuthStore from "../store/authStore";

const useSignUpWithEmailNPass = () => {
  const [createUserWithEmailAndPassword] =
    useCreateUserWithEmailAndPassword(auth);
  const [loading, setLoading] = useState(false);
  const showToast = useShowToast();
  const loginUser = useAuthStore((state) => state.login);

  const signup = async (inputs) => {
    if (
      !inputs.email ||
      !inputs.password ||
      !inputs.fullName ||
      !inputs.username
    ) {
      showToast("Error", "Please provide all required inputs", "error");
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(inputs.email)) {
      showToast("Error", "Please enter a valid email address", "error");
      return;
    }

    if (inputs.password.length < 6) {
      showToast(
        "Error",
        "Password must be at least 6 characters long",
        "error"
      );
      return;
    }

    setLoading(true);
    try {
      // Check The Username
      const userRef = collection(firestore, "users");
      const q = query(userRef, where("username", "==", inputs.username));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        showToast("Oops", "Username Already Exists", "error");
        return;
      }
      // Continue to sign the user in
      const newUser = await createUserWithEmailAndPassword(
        inputs.email,
        inputs.password
      );

      if (!newUser) {
        showToast("Error", "User creation failed", "error");
        setLoading(false);
        return;
      }

      const userDoc = {
        uid: newUser.user.uid,
        email: inputs.email,
        username: inputs.username,
        fullName: inputs.fullName,
        bio: "",
        profilePicURL: "",
        Followers: [],
        Following: [],
        posts: [],
        createdAt: Date.now(),
      };

      await setDoc(doc(firestore, "users", newUser.user.uid), userDoc);
      localStorage.setItem("user-info", JSON.stringify(userDoc));
      loginUser(userDoc);
      showToast("Success", "User signed up successfully!", "success");
    } catch (error) {
      console.log("Signup error:", error);
      showToast("Error", error.message, "error");
    } finally {
      setLoading(false); // Stop loading after everything is done
    }
  };

  return {
    loading,
    signup,
  };
};

export default useSignUpWithEmailNPass;
