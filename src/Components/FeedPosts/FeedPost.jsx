import { AspectRatio, Box, Flex, Image, Skeleton } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { BiRepost } from "react-icons/bi";
import PostFooter from "./PostFooter";
import PostHeader from "./PostHeader";
import RichText from "../RichText";
import useGetUserProfileById from "../../hooks/useGetUserProfileById";
import useLivePost from "../../hooks/useLivePost";
import QuotedPost, { DeletedPostNotice } from "./QuotedPost";

const isPlainRepost = (post) => !!post.repostOf && !post.caption;

const FeedPost = ({ post }) =>
  isPlainRepost(post) ? <RepostedPost repost={post} /> : <PostCard post={post} />;

export default FeedPost;

// A post (or quote post) with header, body and actions
const PostCard = ({ post }) => {
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
        <Box my={2} fontSize={"md"}>
          <RichText text={post.caption} />
        </Box>
      )}
      {post.repostOf && <QuotedPost postId={post.repostOf} />}
      <PostFooter post={post} creatorProfile={userProfile} />
    </>
  );
};

// "X reposted" banner above the live original
const RepostedPost = ({ repost }) => {
  const { userProfile: reposter } = useGetUserProfileById(repost.createdBy);
  const { post: original, isLoading } = useLivePost(repost.repostOf);

  return (
    <Box>
      <Flex alignItems={"center"} gap={1} fontSize={12} color={"gray.500"} fontWeight={"bold"}>
        <BiRepost size={16} />
        {reposter ? (
          <Link to={`/${reposter.username}`}>{reposter.username} reposted</Link>
        ) : (
          <Skeleton w={"80px"} h={"10px"} />
        )}
      </Flex>
      {isLoading && <Skeleton w={"full"} h={"200px"} my={2} mb={10} />}
      {!isLoading && original && <PostCard post={original} />}
      {!isLoading && !original && <DeletedPostNotice mb={10} />}
    </Box>
  );
};
