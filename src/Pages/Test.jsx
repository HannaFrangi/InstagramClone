import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { useState } from "react";

const test = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationId, setVerificationId] = useState(null);
  const auth = getAuth();

  // Function to initialize and render the reCAPTCHA verifier
  const setupRecaptcha = () => {
    window.recaptchaVerifier = new RecaptchaVerifier(
      "recaptcha-container", // The ID of your div container
      {
        size: "invisible", // Invisible reCAPTCHA
        callback: (response) => {
          // reCAPTCHA solved - will proceed with sending the phone number
          console.log("reCAPTCHA solved");
        },
      },
      auth
    );
  };

  // Function to handle sending the phone number for verification
  const handleSendCode = async () => {
    setupRecaptcha(); // Initialize the reCAPTCHA verifier
    const appVerifier = window.recaptchaVerifier;

    try {
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        appVerifier
      );
      setVerificationId(confirmationResult.verificationId);
      alert("Verification code sent to your phone.");
    } catch (error) {
      console.error(error);
      alert("Failed to send verification code. Please try again.");
    }
  };

  const handleVerifyCode = async () => {
    const credential = firebase.auth.PhoneAuthProvider.credential(
      verificationId,
      verificationCode
    );
    try {
      await auth.signInWithCredential(credential);
      alert("Phone authentication successful");
    } catch (error) {
      console.error(error);
      alert("Failed to verify code");
    }
  };

  return (
    <div>
      <h2>Phone Sign In</h2>
      <input
        type="tel"
        placeholder="Enter phone number"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
      />
      <button onClick={handleSendCode}>Send Code</button>

      {/* reCAPTCHA container, this is where Firebase will render the widget */}
      <div id="recaptcha-container"></div>

      {verificationId && (
        <>
          <input
            type="text"
            placeholder="Enter verification code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
          />
          <button onClick={handleVerifyCode}>Verify Code</button>
        </>
      )}
    </div>
  );
};

export default test;
