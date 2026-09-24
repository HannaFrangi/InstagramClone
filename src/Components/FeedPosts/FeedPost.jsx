import { AspectRatio, Box, Image, Text } from "@chakra-ui/react";
import PostFooter from "./PostFooter";
import PostHeader from "./PostHeader";
import useGetUserProfileById from "../../hooks/useGetUserProfileById";

const FeedPost = ({ post }) => {
  const { userProfile } = useGetUserProfileById(post.createdBy);

  return (
    <>
      <PostHeader post={post} creatorProfile={userProfile} />
      {post.imageURL ? (
        <Box my={2} borderRadius={4} overflow={"hidden"}>
          <AspectRatio ratio={1 / 1}>
            <Image src={post.imageURL} alt={post.createdBy} />
          </AspectRatio>
        </Box>
      ) : (
        <Text my={2} fontSize={"md"} whiteSpace={"pre-wrap"} wordBreak={"break-word"}>
          {post.caption}
        </Text>
      )}
      <PostFooter post={post} creatorProfile={userProfile} />
    </>
  );
};

export default FeedPost;
