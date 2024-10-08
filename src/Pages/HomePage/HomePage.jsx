import { Box, Container, Flex, Spinner, Center } from "@chakra-ui/react";
import React, { useState, useEffect } from "react";
import FeedPosts from "../../Components/FeedPosts/FeedPosts";
import SuggestedUsers from "../../Components/SuggestedUsers/SuggestedUsers";

const HomePage = () => {
  document.title = "Home🌟";
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <Center height='100vh'>
        <Spinner size='xl' />
      </Center>
    );
  }

  return (
    <Container maxW={"container.lg"}>
      <Flex gap={20}>
        <Box flex={2} py={10}>
          <FeedPosts />
        </Box>
        <Box
          flex={3}
          mr={20}
          display={{ base: "none", lg: "block" }}
          maxW={"300px"}
        >
          <SuggestedUsers />
        </Box>
      </Flex>
    </Container>
  );
};

export default HomePage;
