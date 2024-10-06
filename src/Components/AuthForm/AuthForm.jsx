import { Box, Image, Text, VStack, Flex, useToast } from "@chakra-ui/react";
import React, { useState } from "react";
import Signup from "./Signup";
import Login from "./Login";
import GoogleAuth from "./GoogleAuth";
// import { auth } from "../../firebase/firebaseConfig";
// import { useSignInWithGoogle } from "react-firebase-hooks/auth";
// import useShowToast from "../../hooks/useShowToast";
// import useAuthStore from "../../store/authStore";

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <>
      <Box border={"1px solid gray"} borderRadius={4} padding={5}>
        <VStack spacing={4}>
          <Image src='/logo.png' h={24} cursor={"pointer"} alt='instagram' />
          {isLogin ? <Login /> : <Signup />}

          {/* ------------OR------------- */}
          <Flex
            alignItems={"center"}
            justifyContent={"center"}
            my={4}
            gap={1}
            w={"full"}
          >
            <Box flex={2} h={"1px"} bg={"red.400"} />
            <Text mx={1} color={"white"}>
              OR
            </Text>
            <Box flex={2} h={"1px"} bg={"red.400"} />
          </Flex>
          <GoogleAuth prefix={isLogin ? "Log in " : "Sign Up "} />
        </VStack>
      </Box>
      {/* More shiii */}
      <Box border={"1px solid gray"} borderRadius={4} padding={5}>
        <Flex alignItems={"center"} justifyContent={"center"}>
          <Box mx={2} fontSize={14}>
            {isLogin ? "Don't have An Account?" : "Already Have An Account?"}
          </Box>
          <Box
            onClick={() => setIsLogin(!isLogin)}
            color={"blue.500"}
            cursor={"pointer"}
          >
            {isLogin ? "Sign Up" : "Log In"}
          </Box>
        </Flex>
      </Box>
    </>
  );
};

export default AuthForm;
