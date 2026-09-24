import { Avatar, Box, Flex, Image, Skeleton, Text } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import RichText from "../RichText";
import useGetUserProfileById from "../../hooks/useGetUserProfileById";
import useLivePost from "../../hooks/useLivePost";
import { timeAgo } from "../../utils/timeAgo";

// Compact, read-only preview of the post being quoted
const QuotedPost = ({ postId }) => {
  const { post, isLoading } = useLivePost(postId);
  const { userProfile } = useGetUserProfileById(post?.createdBy);

  if (isLoading) return <Skeleton w={"full"} h={"80px"} borderRadius={8} />;
  if (!post) return <DeletedPostNotice />;

  return (
    <Box border={"1px solid"} borderColor={"whiteAlpha.300"} borderRadius={8} p={3}>
      <Flex alignItems={"center"} gap={2} fontSize={12} mb={1}>
        <Avatar.Root size={"2xs"}>
          <Avatar.Image src={userProfile?.profilePicURL || undefined} />
          <Avatar.Fallback name={userProfile?.username} />
        </Avatar.Root>
        {userProfile && (
          <Link to={`/${userProfile.username}`}>
            <Text fontWeight={"bold"}>{userProfile.username}</Text>
          </Link>
        )}
        <Text color={"gray.500"}>• {timeAgo(post.createdAt)}</Text>
      </Flex>
      {post.caption && (
        <Box fontSize={"sm"} lineClamp={4}>
          <RichText text={post.caption} />
        </Box>
      )}
      {post.imageURL && (
        <Image src={post.imageURL} alt={"quoted post"} mt={2} borderRadius={4} maxH={"200px"} objectFit={"cover"} />
      )}
    </Box>
  );
};

export const DeletedPostNotice = (props) => (
  <Box
    border={"1px solid"}
    borderColor={"whiteAlpha.300"}
    borderRadius={8}
    p={3}
    my={2}
    fontSize={"sm"}
    color={"gray.500"}
    {...props}
  >
    This post has been deleted.
  </Box>
);

export default QuotedPost;
