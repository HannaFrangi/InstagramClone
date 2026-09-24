import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
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
  const [loading, setLoading] = useState(false);
  const showToast = useShowToast();
  const loginUser = useAuthStore((state) => state.login);

  const isValidUsername = (username) => {
    if (username.length < 1 || username.length > 30) {
      return false;
    }

    const regex = /^(?!.*\.\.)(?!.*\.$)[a-zA-Z0-9._]+$/;

    if (!regex.test(username)) {
      return false;
    }

    return true;
  };

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

    if (!isValidUsername(inputs.username)) {
      showToast(
        "Error",
        "Username must be 1-30 characters long and can only contain letters, numbers, periods, and underscores.",
        "error"
      );
      return;
    }

    setLoading(true);
    // The account is created first: Firebase Auth rejects duplicate emails
    // itself, and the security rules only let signed-in users read profiles.
    let newUser = null;
    let profileCreated = false;
    try {
      newUser = await createUserWithEmailAndPassword(
        auth,
        inputs.email,
        inputs.password
      );

      const q = query(
        collection(firestore, "users"),
        where("username", "==", inputs.username.toLowerCase())
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        showToast("Oops", "Username Already Exists", "error");
        return;
      }

      // The email stays in Firebase Auth only: profiles are readable by every
      // signed-in user, so they must not hold private details
      const userDoc = {
        uid: newUser.user.uid,
        username: inputs.username.toLowerCase(),
        fullName: inputs.fullName,
        bio: "",
        profilePicURL: "",
        Followers: [],
        Following: [],
        posts: [],
        createdAt: Date.now(),
      };

      await setDoc(doc(firestore, "users", newUser.user.uid), userDoc);
      profileCreated = true;
      localStorage.setItem("user-info", JSON.stringify(userDoc));
      loginUser(userDoc);
      showToast("Success", "User signed up successfully!", "success");
    } catch (error) {
      console.log("Signup error:", error);
      if (error.code === "auth/email-already-in-use") {
        showToast(
          "Error",
          "Email already exists. Please use a different email.",
          "error"
        );
      } else {
        showToast("Error", error.message, "error");
      }
    } finally {
      // Don't leave behind an account with no profile (e.g. username taken),
      // so the same email can be used to try again
      if (newUser && !profileCreated) {
        await newUser.user.delete().catch(console.error);
      }
      setLoading(false);
    }
  };

  return {
    loading,
    signup,
  };
};

export default useSignUpWithEmailNPass;
