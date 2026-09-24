import {
  Box,
  Button,
  Flex,
  Input,
  InputGroup,
  Menu,
  Portal,
  Spinner,
  Text,
  Textarea,
  useDisclosure,
} from "@chakra-ui/react";
import { BiRepost } from "react-icons/bi";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";
import useBookmark from "../../hooks/useBookmarks";
import { useRef, useState } from "react";
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
import useRepost from "../../hooks/useRepost";
import RichText from "../RichText";
import QuotedPost from "./QuotedPost";
import {
  AppDialogRoot,
  AppDialogBackdrop,
  AppDialogPositioner,
  AppDialogContent,
  AppDialogCloseTrigger,
  AppDialogHeader,
  AppDialogBody,
  AppDialogFooter,
} from "../AppDialog.jsx";

const CommentItem = ({ comment }) => {
  const { userProfile: commentUser, isLoading: commentLoading } =
    useGetUserProfileById(comment?.createdBy);

  if (commentLoading) {
    return <Spinner size="xs" />;
  }

  return (
    <Text fontSize="sm">
      <Text as="span" fontWeight="600" mr={1}>
        {commentUser?.username}
      </Text>
      <RichText text={comment.comment} />
    </Text>
  );
};

const PostFooter = ({ post, isProfilePage, creatorProfile }) => {
  const { isCommenting, handlePostComment } = usePostComment();
  const [comment, setComment] = useState("");
  const authUser = useAuthStore((state) => state.user);
  const commentRef = useRef(null);
  const { handleLikePost, isLiked, likes } = useLikePost(post, authUser);
  const { open, onOpen, onClose } = useDisclosure();
  const repost = useRepost(post);
  const bookmark = useBookmark(post.id, authUser?.uid);
  const quoteDialog = useDisclosure();

  const handleSubmitComment = async () => {
    await handlePostComment(post, comment);
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

        <RepostMenu repost={repost} onQuote={quoteDialog.onOpen} />

        {authUser && (
          <Box
            as="button"
            ml="auto"
            cursor="pointer"
            fontSize={20}
            onClick={bookmark.toggleBookmark}
            opacity={bookmark.isUpdating ? 0.5 : 1}
            aria-label={bookmark.isSaved ? "Remove from saved" : "Save post"}
          >
            {bookmark.isSaved ? <BsBookmarkFill /> : <BsBookmark />}
          </Box>
        )}
      </Flex>
      <Text fontWeight={600} fontSize="sm">
        {likes} likes
        {repost.repostCount > 0 && ` · ${repost.repostCount} reposts`}
      </Text>
      {isProfilePage && (
        <Text fontSize="12" color="gray">
          Posted {timeAgo(post.createdAt)}
        </Text>
      )}

      {!isProfilePage && (
        <>
          {post.imageURL && post.caption && (
            <Text fontSize="sm" mb={2}>
              <Text as="span" fontWeight="600" mr={1}>
                {creatorProfile?.username}
              </Text>
              <RichText text={post.caption} />
            </Text>
          )}
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
          {open && (
            <CommentsModal isOpen={open} onClose={onClose} post={post} />
          )}
        </>
      )}
      {quoteDialog.open && (
        <QuoteDialog
          post={post}
          onClose={quoteDialog.onClose}
          quotePost={repost.quotePost}
          isPosting={repost.isReposting}
        />
      )}
      {authUser && (
        <Flex
          alignItems="center"
          gap={2}
          justifyContent="space-between"
          w="full"
        >
          <InputGroup
            endElement={
              <Button
                fontSize={14}
                color="blue.500"
                fontWeight={600}
                cursor="pointer"
                _hover={{ color: "white" }}
                bg="transparent"
                onClick={handleSubmitComment}
                loading={isCommenting}
              >
                Post
              </Button>
            }
          >
            <Input
              variant="flushed"
              placeholder="Add a comment..."
              fontSize={14}
              onChange={(e) => setComment(e.target.value)}
              value={comment}
              ref={commentRef}
            />
          </InputGroup>
        </Flex>
      )}
    </Box>
  );
};

export default PostFooter;

const RepostMenu = ({ repost, onQuote }) => {
  const { hasReposted, isReposting, toggleRepost } = repost;

  return (
    <Menu.Root
      onSelect={({ value }) => (value === "quote" ? onQuote() : toggleRepost())}
    >
      <Menu.Trigger asChild>
        <Box
          as="button"
          cursor="pointer"
          fontSize={24}
          color={hasReposted ? "green.400" : undefined}
          opacity={isReposting ? 0.5 : 1}
          aria-label="Repost"
          disabled={isReposting}
        >
          <BiRepost />
        </Box>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content bg="black" border="1px solid" borderColor="whiteAlpha.300">
            <Menu.Item value="repost" cursor="pointer">
              {hasReposted ? "Undo repost" : "Repost"}
            </Menu.Item>
            <Menu.Item value="quote" cursor="pointer">
              Quote
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};

const MAX_QUOTE_LENGTH = 280;

const QuoteDialog = ({ post, onClose, quotePost, isPosting }) => {
  const [text, setText] = useState("");

  const handleQuote = async () => {
    if (await quotePost(text)) onClose();
  };

  return (
    <AppDialogRoot isOpen onClose={onClose} size="lg">
      <AppDialogBackdrop />
      <AppDialogPositioner>
        <AppDialogContent bg="black" border="1px solid gray">
          <AppDialogHeader>Quote post</AppDialogHeader>
          <AppDialogCloseTrigger />
          <AppDialogBody>
            <Textarea
              placeholder="Add a comment..."
              value={text}
              maxLength={MAX_QUOTE_LENGTH}
              onChange={(e) => setText(e.target.value)}
              mb={3}
            />
            <QuotedPost postId={post.id} />
          </AppDialogBody>
          <AppDialogFooter>
            <Button onClick={handleQuote} loading={isPosting} disabled={!text.trim()}>
              Post
            </Button>
          </AppDialogFooter>
        </AppDialogContent>
      </AppDialogPositioner>
    </AppDialogRoot>
  );
};
