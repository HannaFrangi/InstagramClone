import {
  Avatar,
  Box,
  Flex,
  useDisclosure,
  Button,
  Text,
  VStack,
  Separator,
  Spinner,
  Center,
} from "@chakra-ui/react";
import { NotificationsLogo } from "../../Assets/Contents";
import useNotifications from "../../hooks/useNotification";
import useGetUserProfileById from "../../hooks/useGetUserProfileById";
import { MdDelete, MdDeleteOutline } from "react-icons/md";
import useGetPostByid from "../../hooks/useGetPostByid";

import { useState } from "react";
import Comment from "../Comment/Comment";
import Caption from "../Comment/Caption";
import useAuthStore from "../../store/authStore";
import PostFooter from "../FeedPosts/PostFooter";
import useShowToast from "../../hooks/useShowToast";
import useDeletePost from "../../hooks/useDeletePost";
import PostModalMedia from "../FeedPosts/PostModalMedia";
import { Link } from "react-router-dom";
import {
  AppDialogRoot,
  AppDialogBackdrop,
  AppDialogPositioner,
  AppDialogContent,
  AppDialogCloseTrigger,
  AppDialogHeader,
  AppDialogBody,
} from "../AppDialog.jsx";
import { AppTooltip } from "../AppTooltip.jsx";

const Notifications = () => {
  const { open, onOpen, onClose } = useDisclosure();
  const { notifications, loading, deleteNotification } = useNotifications();

  return (
    <>
      <AppTooltip
        label={"Notifications"}
        placement="right"
        ml={1}
        openDelay={500}
        display={{ base: "block", md: "none" }}
      >
        <Flex
          alignItems={"center"}
          gap={4}
          _hover={{ bg: "whiteAlpha.400" }}
          borderRadius={6}
          p={2}
          w={{ base: 10, md: "full" }}
          justifyContent={{ base: "center", md: "flex-start" }}
          onClick={onOpen}
        >
          <NotificationsLogo />
          <Box display={{ base: "none", md: "block" }}>Notifications</Box>
        </Flex>
      </AppTooltip>

      <AppDialogRoot isOpen={open} onClose={onClose}>
        <AppDialogBackdrop />
        <AppDialogPositioner>
          <AppDialogContent bg={"black"} border={"1px solid gray"} maxW={"400px"}>
            <AppDialogHeader>Notifications</AppDialogHeader>
            <AppDialogCloseTrigger />
            <AppDialogBody>
              {loading ? (
                <Center height={"100vh"}>
                  <Spinner color="white" />
                </Center>
              ) : (
                <Box>
                  {notifications.length === 0 ? (
                    <Box>No notifications yet🤷‍♂️</Box>
                  ) : (
                    notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onDelete={deleteNotification}
                        onOpen={onOpen}
                        onClose={onClose}
                      />
                    ))
                  )}
                </Box>
              )}
            </AppDialogBody>
          </AppDialogContent>
        </AppDialogPositioner>
      </AppDialogRoot>
    </>
  );
};

// Wording for each notification type: "<name> {before} {link} {emoji}"
const NOTIFICATION_TEXT = {
  like: { before: 'liked', link: 'your post', emoji: '❤' },
  mention: { before: 'mentioned you in', link: 'a post', emoji: '💬' },
  repost: { before: 'reposted', link: 'your post', emoji: '🔁' },
  quote: { before: 'quoted', link: 'your post', emoji: '🔁' },
};

const NotificationItem = ({ notification, onDelete, onOpen, onClose }) => {
  const [openPostModal, setOpenPostModal] = useState(false);
  const authUser = useAuthStore((state) => state.user);
  const showToast = useShowToast();

  const { userProfile, isLoading: profileLoading } = useGetUserProfileById(
    notification?.senderId
  );

  const {
    post,
    isLoading: postLoading,
    getPostbyId,
  } = useGetPostByid(notification?.postId);
  const { userProfile: postOwner } = useGetUserProfileById(post?.createdBy);
  const handlePostClick = async () => {
    await getPostbyId(notification.postId);
    setOpenPostModal(true);
    onOpen();
  };

  const text = NOTIFICATION_TEXT[notification.type] ?? NOTIFICATION_TEXT.like;

  const handleDelete = () => {
    onDelete(notification.id);
  };

  const { isDeleting, deletePost } = useDeletePost();

  const handleDeletePost = async () => {
    if (await deletePost({ ...post, id: notification.postId })) {
      showToast("Success", "Post deleted successfully", "success");
      onClose();
    }
  };

  return (
    <>
      <Flex
        p={2}
        borderBottom='1px'
        borderColor='gray.200'
        alignItems='center'
        justifyContent='center'
        gap={2}>
        {profileLoading || postLoading ? (
          <Center>
            <Spinner size='xl' />
          </Center>
        ) : (
          <Flex alignItems='center' gap={2} w='full'>
            <Link to={`/${userProfile?.username}`}>
              <Box onClick={onClose} cursor={'pointer'}>
                <Avatar.Root>
                  <Avatar.Image src={userProfile?.profilePicURL || undefined} />
                  <Avatar.Fallback name={userProfile?.fullName} />
                </Avatar.Root>
              </Box>
            </Link>
            <Text onClick={onClose} cursor={'pointer'}>
              <strong>{userProfile?.fullName}</strong> {text.before}{' '}
              <Text
                as='span'
                color='red.400'
                onClick={handlePostClick}
                cursor='pointer'>
                {text.link}
              </Text>{' '}
              {text.emoji}
            </Text>
            <Button
              variant='ghost'
              onClick={handleDelete}
              colorPalette='red'
              size='sm'
              aria-label='Delete notification'
              ml='auto'>
              <MdDeleteOutline />
            </Button>
          </Flex>
        )}
      </Flex>

      {openPostModal && post && postOwner && (
        <AppDialogRoot
          isOpen={openPostModal}
          onClose={() => setOpenPostModal(false)}
          size='5xl'>
          <AppDialogBackdrop />
          <AppDialogPositioner>
            <AppDialogContent>
              <AppDialogCloseTrigger />
              <AppDialogBody bg={'black'} pb={5}>
                <Flex
                  gap='4'
                  w={{ base: '90%', sm: '70%', md: 'full' }}
                  mx={'auto'}
                  maxH={'90vh'}
                  minH={'50vh'}>
                  <Flex
                    borderRadius={4}
                    overflow={'hidden'}
                    border={'1px solid'}
                    borderColor={'whiteAlpha.300'}
                    flex={1.5}
                    justifyContent={'center'}
                    alignItems={'center'}>
                    <PostModalMedia post={post} />
                  </Flex>
                  <Flex
                    flex={1}
                    flexDir={'column'}
                    px={10}
                    display={{ base: 'none', md: 'flex' }}>
                    <Flex
                      alignItems={'center'}
                      justifyContent={'space-between'}>
                      <Flex alignItems={'center'} gap={4}>
                        <Avatar.Root size={'sm'}>
                          <Avatar.Image
                            src={postOwner.profilePicURL || undefined}
                          />
                          <Avatar.Fallback name={postOwner.username} />
                        </Avatar.Root>
                        <Text fontWeight={'bold'} fontSize={12}>
                          {postOwner.username}
                        </Text>
                      </Flex>

                      {authUser?.uid === postOwner.uid && (
                        <Button
                          size={'sm'}
                          bg={'transparent'}
                          _hover={{ bg: 'whiteAlpha.300', color: 'red.600' }}
                          borderRadius={4}
                          p={1}
                          onClick={handleDeletePost}
                          loading={isDeleting}>
                          <MdDelete size={20} cursor='pointer' />
                        </Button>
                      )}
                    </Flex>
                    <Separator my={4} borderColor={'gray.500'} />

                    <VStack
                      w='full'
                      alignItems={'start'}
                      maxH={'350px'}
                      overflowY={'auto'}>
                      {post.caption && <Caption post={post} key={post.id} />}
                      {post.comments.map((comment) => (
                        <Comment key={comment.id} comment={comment} />
                      ))}
                    </VStack>
                    <Separator my={4} borderColor={'gray.800'} />

                    <PostFooter isProfilePage={true} post={post} />
                  </Flex>
                </Flex>
              </AppDialogBody>
            </AppDialogContent>
          </AppDialogPositioner>
        </AppDialogRoot>
      )}
    </>
  );
};

export default Notifications;
