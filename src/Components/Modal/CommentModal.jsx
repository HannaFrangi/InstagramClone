import { Button, Flex, Input } from "@chakra-ui/react";
import Comment from "../Comment/Comment";
import usePostComment from "../../hooks/usePostComment";
import { useEffect, useRef } from "react";
import {
  AppDialogRoot,
  AppDialogBackdrop,
  AppDialogPositioner,
  AppDialogContent,
  AppDialogCloseTrigger,
  AppDialogHeader,
  AppDialogBody,
} from "../AppDialog.jsx";

const CommentsModal = ({ isOpen, onClose, post }) => {
  const { handlePostComment, isCommenting } = usePostComment();
  const commentRef = useRef(null);
  const commentsContainerRef = useRef(null);
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    await handlePostComment(post.id, commentRef.current.value);
    commentRef.current.value = "";
  };

  useEffect(() => {
    const scrollToBottom = () => {
      commentsContainerRef.current.scrollTop =
        commentsContainerRef.current.scrollHeight;
    };
    if (isOpen) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [isOpen, post.comments.length]);

  return (
    <AppDialogRoot isOpen={isOpen} onClose={onClose}>
      <AppDialogBackdrop />
      <AppDialogPositioner>
        <AppDialogContent bg={"black"} border={"1px solid gray"} maxW={"400px"}>
          <AppDialogHeader>Comments</AppDialogHeader>
          <AppDialogCloseTrigger />
          <AppDialogBody pb={6}>
            <Flex
              mb={4}
              gap={4}
              flexDir={"column"}
              maxH={"250px"}
              overflowY={"auto"}
              ref={commentsContainerRef}
            >
              {post.comments.map((comment, idx) => (
                <Comment key={idx} comment={comment} />
              ))}
            </Flex>
            <form onSubmit={handleSubmitComment} style={{ marginTop: "2rem" }}>
              <Input placeholder="Comment" size={"sm"} ref={commentRef} />
              <Flex w={"full"} justifyContent={"flex-end"}>
                <Button
                  type="submit"
                  ml={"auto"}
                  size={"sm"}
                  my={4}
                  loading={isCommenting}
                >
                  Post
                </Button>
              </Flex>
            </form>
          </AppDialogBody>
        </AppDialogContent>
      </AppDialogPositioner>
    </AppDialogRoot>
  );
};

export default CommentsModal;
