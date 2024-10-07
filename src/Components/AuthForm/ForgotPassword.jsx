import { Box, Button, Input, VStack } from "@chakra-ui/react";
import { useState } from "react";
import { auth } from "../../firebase/firebaseConfig";
import { sendPasswordResetEmail } from "firebase/auth";
import useShowToast from "../../hooks/useShowToast";

const ForgotPassword = ({ onClose }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const showToast = useShowToast();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const actionCodeSettings = {
        url: `https://igclonefrangi.vercel.app/reset-password`,
        handleCodeInApp: true,
      };
      await sendPasswordResetEmail(auth, email, actionCodeSettings);

      showToast(
        "Success",
        "Password reset email sent! Please check your inbox.",
        "success"
      );
      if (onClose) onClose();
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        showToast("Error", "No user found with this email address.", "error");
      } else {
        showToast("Error", error.message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <VStack spacing={4}>
        <Input
          placeholder='Enter your email'
          fontSize={14}
          type='email'
          size={"sm"}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button
          w={"full"}
          colorScheme='blue'
          size={"sm"}
          fontSize={14}
          isLoading={loading}
          onClick={handleResetPassword}
        >
          Send Reset Email
        </Button>
      </VStack>
    </Box>
  );
};

export default ForgotPassword;
