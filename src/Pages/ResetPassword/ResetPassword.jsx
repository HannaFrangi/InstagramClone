import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Text,
  VStack,
  Flex,
  Heading,
} from "@chakra-ui/react";
import { auth } from "../../firebase/firebaseConfig";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import useShowToast from "../../hooks/useShowToast";

const ResetPassword = () => {
  const { oobCode } = useParams();
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const showToast = useShowToast();
  const navigate = useNavigate();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verify the oobCode
      await verifyPasswordResetCode(auth, oobCode);

      // Confirm the password reset
      await confirmPasswordReset(auth, oobCode, newPassword);
      showToast("Success", "Password has been reset successfully!", "success");
      navigate("/");
    } catch (error) {
      console.log(error);
      showToast("Error", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex
      align='center'
      justify='center'
      h='100vh'
      // bgGradient='linear(to-r, blue.500, purple.500)'
      p={4}
    >
      <Box
        bg='black.300'
        borderRadius='md'
        boxShadow='lg'
        p={6}
        width={{ base: "90%", sm: "400px" }}
      >
        <Heading as='h2' size='lg' mb={4} textAlign='center'>
          Reset Your Password
        </Heading>
        <VStack spacing={4} as='form' onSubmit={handleResetPassword}>
          <FormControl>
            <FormLabel>New Password:</FormLabel>
            <Input
              placeholder='New Password'
              fontSize={14}
              size='sm'
              type='password'
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </FormControl>
          <Button
            colorScheme='blue'
            size='sm'
            fontSize={14}
            isLoading={loading}
            type='submit'
          >
            Reset Password
          </Button>
        </VStack>
      </Box>
    </Flex>
  );
};

export default ResetPassword;
