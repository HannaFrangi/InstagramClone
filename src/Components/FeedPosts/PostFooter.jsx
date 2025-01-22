import {
  Box,
  Button,
  Flex,
  Input,
  InputGroup,
  InputRightElement,
  Spacer,
  Spinner,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useRef, useState, useEffect } from "react";
import {
  CommentLogo,
  NotificationsLogo,
  UnlikeLogo,
} from "../../Assets/Contents";
import usePostComment from "../../hooks/usePostComment";
import useAuthStore from "../../store/authStore";
import useLikePost from "../../hooks/useLikePost";
import { timeAgo } from "../../utils/timeAgo";
import CommentsModal from "../Modal/CommentModal";
import useGetUserProfileById from "../../hooks/useGetUserProfileById";

const CommentItem = ({ comment }) => {
  const [shouldFetch, setShouldFetch] = useState(false);
  const { userProfile: commentUser, isLoading: commentLoading } =
    useGetUserProfileById(comment?.createdBy);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldFetch(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (!shouldFetch || commentLoading) {
    return <Spinner size="xs" />;
  }

  return (
    <Text fontSize="sm">
      <Text as="span" fontWeight="600" mr={1}>
        {commentUser?.username}
      </Text>
      {comment.comment}
    </Text>
  );
};

const PostFooter = ({ post, isProfilePage, creatorProfile }) => {
  const { isCommenting, handlePostComment } = usePostComment();
  const [comment, setComment] = useState("");
  const authUser = useAuthStore((state) => state.user);
  const commentRef = useRef(null);
  const { handleLikePost, isLiked, likes } = useLikePost(post, authUser);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleSubmitComment = async () => {
    await handlePostComment(post.id, comment);
    setComment("");
  };

  return (
    <Box mb={10} marginTop="auto">
      <Flex alignItems="center" gap={4} w="full" pt={0} mb={2} mt={4}>
        <Box onClick={handleLikePost} cursor="pointer" fontSize={18}>
          {!isLiked ? <NotificationsLogo /> : <UnlikeLogo />}
        </Box>

        <Box
          cursor="pointer"
          fontSize={18}
          onClick={() => commentRef.current.focus()}
        >
          <CommentLogo />
        </Box>
      </Flex>
      <Text fontWeight={600} fontSize="sm">
        {likes} likes
      </Text>
      {isProfilePage && (
        <Text fontSize="12" color="gray">
          Posted {timeAgo(post.createdAt)}
        </Text>
      )}

      {!isProfilePage && (
        <>
          <Text fontSize="sm" mb={2}>
            <Text as="span" fontWeight="600" mr={1}>
              {creatorProfile?.username}
            </Text>
            {post.caption}
          </Text>
          <Flex direction="column" gap={2} mt={-1}>
            {post.comments.slice(0, 1).map((comment, index) => (
              <CommentItem key={index} comment={comment} />
            ))}
            {post.comments.length > 1 && (
              <Text
                fontSize="sm"
                color="gray.500"
                cursor="pointer"
                onClick={onOpen}
              >
                View all {post.comments.length} comments
              </Text>
            )}
          </Flex>
          {isOpen && (
            <CommentsModal isOpen={isOpen} onClose={onClose} post={post} />
          )}
        </>
      )}
      {authUser && (
        <Flex
          alignItems="center"
          gap={2}
          justifyContent="space-between"
          w="full"
        >
          <InputGroup>
            <Input
              variant="flushed"
              placeholder="Add a comment..."
              fontSize={14}
              onChange={(e) => setComment(e.target.value)}
              value={comment}
              ref={commentRef}
            />
            <InputRightElement>
              <Button
                fontSize={14}
                color="blue.500"
                fontWeight={600}
                cursor="pointer"
                _hover={{ color: "white" }}
                bg="transparent"
                onClick={handleSubmitComment}
                isLoading={isCommenting}
              >
                Post
              </Button>
            </InputRightElement>
          </InputGroup>
        </Flex>
      )}
    </Box>
  );
};

export default PostFooter;
