import {
  Box,
  Button,
  Container,
  Flex,
  Skeleton,
  SkeletonCircle,
  Text,
  VStack,
  Image,
} from "@chakra-ui/react";
import FeedPost from "./FeedPost";
import useGetFeedPosts from "../../hooks/useGetFeedPosts";

const FeedPosts = () => {
  const { isLoading, posts, error, refresh } = useGetFeedPosts(); // Assume refresh is a function to reload posts

  return (
    <Container maxW={"container.sm"} py={10} px={2}>
      {isLoading &&
        [0, 1, 2].map((_, idx) => (
          <VStack key={idx} gap={4} alignItems={"flex-start"} mb={10}>
            <Flex gap="2">
              <SkeletonCircle size="10" />
              <VStack gap={2} alignItems={"flex-start"}>
                <Skeleton height="10px" w={"200px"} />
                <Skeleton height="10px" w={"200px"} />
              </VStack>
            </Flex>
            <Skeleton w={"full"}>
              <Box h={"400px"}>contents wrapped</Box>
            </Skeleton>
          </VStack>
        ))}

      {!isLoading && error && (
        <Text fontSize={"md"} color={"red.400"}>
          Oops! Something went wrong. Please try again later.
        </Text>
      )}

      {!isLoading &&
        posts.length > 0 &&
        posts.map((post) => <FeedPost key={post.id} post={post} />)}

      {!isLoading && posts.length === 0 && (
        <>
          <Text fontSize={"md"} color={"red.400"}>
            No posts WTf
          </Text>
          <Text color={"red.400"}>Go Follow Someone 🙁</Text>
          <Button onClick={refresh} colorScheme="blue" mt={4}>
            Refresh Feed
          </Button>
        </>
      )}
    </Container>
  );
};

export default FeedPosts;
