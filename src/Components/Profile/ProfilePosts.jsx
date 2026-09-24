import { Box, Flex, Grid, Skeleton, Text, VStack } from "@chakra-ui/react";
import ProfilePost from "./ProfilePost";
import FeedPost from "../FeedPosts/FeedPost";
import useGetUserPosts from "../../hooks/useGetUserPosts";
import useAuthStore from "../../store/authStore";
import useBookmarkStore from "../../store/bookmarkStore";
import {
  useGetLikedPosts,
  useGetSavedPosts,
} from "../../hooks/useGetSavedAndLikedPosts";

// view: "posts" lists everything (text, images, reposts) like a timeline;
// "media" is the image grid; "saved" and "liked" are your own private lists.
const ProfilePosts = ({ view = "posts" }) => {
  if (view === "saved") return <SavedPosts />;
  if (view === "liked") return <LikedPosts />;
  return <UserPosts view={view} />;
};

export default ProfilePosts;

const UserPosts = ({ view }) => {
  const { isLoading, posts } = useGetUserPosts();

  if (isLoading) return <PostsSkeleton />;

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
  return <PostList posts={posts} />;
};

const SavedPosts = () => {
  const postIds = useBookmarkStore((state) => state.postIds);
  const { isLoading, posts } = useGetSavedPosts(postIds);

  if (isLoading) return <PostsSkeleton />;
  if (posts.length === 0)
    return <NoPostsFound text="Nothing saved yet — tap the bookmark on a post" />;
  return <PostList posts={posts} />;
};

const LikedPosts = () => {
  const uid = useAuthStore((state) => state.user?.uid);
  const { isLoading, posts } = useGetLikedPosts(uid);

  if (isLoading) return <PostsSkeleton />;
  if (posts.length === 0) return <NoPostsFound text="No liked posts yet" />;
  return <PostList posts={posts} />;
};

const PostList = ({ posts }) => (
  <Box w={"full"} maxW={"xl"} mx={"auto"} pt={4}>
    {posts.map((post) => (
      <FeedPost key={post.id} post={post} />
    ))}
  </Box>
);

const PostsSkeleton = () => (
  <VStack gap={4} mt={4}>
    {[0, 1, 2].map((idx) => (
      <Skeleton key={idx} w={"full"} h={"200px"} />
    ))}
  </VStack>
);

const NoPostsFound = ({ text }) => {
  return (
    <Flex flexDir="column" textAlign={"center"} mx={"auto"} mt={10}>
      <Text fontSize={"2xl"}>{text}</Text>
    </Flex>
  );
};
