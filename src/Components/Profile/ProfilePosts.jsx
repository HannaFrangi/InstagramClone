import { Box, Flex, Grid, Skeleton, Text, VStack } from "@chakra-ui/react";
import ProfilePost from "./ProfilePost";
import FeedPost from "../FeedPosts/FeedPost";
import useGetUserPosts from "../../hooks/useGetUserPosts";

// view: "posts" lists everything (text, images, reposts) like a timeline;
// "media" is the image grid.
const ProfilePosts = ({ view = "posts" }) => {
  const { isLoading, posts } = useGetUserPosts();

  if (isLoading) {
    return (
      <VStack gap={4} mt={4}>
        {[0, 1, 2].map((idx) => (
          <Skeleton key={idx} w={"full"} h={"200px"} />
        ))}
      </VStack>
    );
  }

  if (view === "media") {
    const mediaPosts = posts.filter((post) => post.imageURL && !post.repostOf);
    if (mediaPosts.length === 0) return <NoPostsFound text="No photos yet" />;
    return (
      <Grid
        templateColumns={{
          sm: "repeat(1, 1fr)",
          md: "repeat(3, 1fr)",
        }}
        gap={1}
        columnGap={1}
      >
        {mediaPosts.map((post) => (
          <ProfilePost key={post.id} post={post} />
        ))}
      </Grid>
    );
  }

  if (posts.length === 0) return <NoPostsFound text="No Posts Found🤔" />;
  return (
    <Box w={"full"} maxW={"xl"} mx={"auto"} pt={4}>
      {posts.map((post) => (
        <FeedPost key={post.id} post={post} />
      ))}
    </Box>
  );
};

export default ProfilePosts;

const NoPostsFound = ({ text }) => {
  return (
    <Flex flexDir="column" textAlign={"center"} mx={"auto"} mt={10}>
      <Text fontSize={"2xl"}>{text}</Text>
    </Flex>
  );
};
