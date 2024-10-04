import { Box, Flex, Link, Text, VStack } from "@chakra-ui/react";
import React from "react";
import SuggestedHeader from "./SuggestedHeader";
import SuggestedUser from "./SuggestedUser";
import { Link as routerLink } from "react-router-dom";
import useGetSuggestedUsers from "../../hooks/useGetSuggestedUsers";

const SuggestedUsers = () => {
  const { suggestedUsers, isLoading } = useGetSuggestedUsers();

  if (isLoading) {
    return null; // todo add skeleton
  }
  return (
    <>
      <VStack py={8} px={6} gap={4}>
        <SuggestedHeader />

        {suggestedUsers.length !== 0 && (
          <Flex
            alignItems={"center"}
            justifyContent={"space-between"}
            w={"full"}
          >
            <Text fontSize={12} fontWeight={"bold"} color={"gray.500"}>
              Suggested For You :
            </Text>
            <Text
              fontSize={12}
              fontWeight={"bold"}
              cursor={"pointer"}
              _hover={{ color: "gray.500" }}
            >
              See all
            </Text>
          </Flex>
        )}

        {suggestedUsers.map((user) => (
          <SuggestedUser user={user} key={user.id} />
        ))}
        <Box fontSize={12} color={"gray.500"} mt={5}>
          <Link
            href='https://github.com/HannaFrangi'
            target='_blank'
            color={"blue.500"}
          >
            2024
          </Link>
        </Box>
      </VStack>
    </>
  );
};

export default SuggestedUsers;
