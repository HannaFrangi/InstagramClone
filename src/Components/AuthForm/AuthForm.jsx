import { Box, Image, Text, VStack, Flex } from "@chakra-ui/react";
import React, { useState } from "react";
import Signup from "./Signup";
import Login from "./Login";
import GoogleAuth from "./GoogleAuth";
import ForgotPassword from "./ForgotPassword";
import { FaS } from "react-icons/fa6";

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  return (
    <>
      <Box border={"1px solid gray"} borderRadius={4} padding={5}>
        <VStack spacing={4}>
          <Image src='/logo.png' h={24} cursor={"pointer"} alt='instagram' />

          {isForgotPassword ? (
            <ForgotPassword onClose={() => setIsForgotPassword(false)} />
          ) : isLogin ? (
            <Login />
          ) : (
            <Signup />
          )}
          {isLogin ? (
            <Box
              onClick={() => {
                setIsForgotPassword(true);
                setIsLogin(false);
              }}
              color={"blue.500"}
              cursor={"pointer"}
              fontSize={14}
              textAlign='center'
            >
              Forgot Password?
            </Box>
          ) : (
            <Box
              onClick={() => {
                setIsForgotPassword(false);
                setIsLogin(true);
              }}
              color={"blue.500"}
              cursor={"pointer"}
              fontSize={14}
              textAlign='center'
            >
              Go back
            </Box>
          )}
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
