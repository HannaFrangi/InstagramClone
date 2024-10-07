import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
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
        // Redirect URL after the user resets their password
        url: `https://igclonefrangi.vercel.app/reset-password`,
        handleCodeInApp: true, // Ensure it's handled within your app
      };

      // Firebase method to send a password reset email
      await sendPasswordResetEmail(auth, email, actionCodeSettings);

      showToast(
        "Success",
        "Password reset email sent! Please check your inbox.",
        "success"
      );

      // Optionally close modal or navigate after email is sent
      if (onClose) onClose();
    } catch (error) {
      // Handle potential errors, e.g., invalid email, network issues, etc.
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
        <Text fontSize='lg' fontWeight='bold'>
          Reset Your Password
        </Text>
        <FormControl>
          <FormLabel>Email:</FormLabel>
          <Input
            placeholder='Enter your email'
            fontSize={14}
            type='email'
            size={"sm"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </FormControl>
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
