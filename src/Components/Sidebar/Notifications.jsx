import {
  Avatar,
  Box,
  Flex,
  useDisclosure,
  Button,
  Text,
  VStack,
  Separator,
  Image,
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
import useUserProfileStore from "../../store/userProfileStore";
import useShowToast from "../../hooks/useShowToast";
import { deleteObject, ref } from "firebase/storage";
import {
  arrayRemove,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { firestore, storage } from "../../firebase/firebaseConfig";
import usePostStore from "../../store/postStore";
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

const NotificationItem = ({ notification, onDelete, onOpen, onClose }) => {
  const [openPostModal, setOpenPostModal] = useState(false);
  const authUser = useAuthStore((state) => state.user);
  const [isDeleting, setIsDeleting] = useState(false);
  const showToast = useShowToast();

  const { userProfile, isLoading: profileLoading } = useGetUserProfileById(
    notification?.senderId
  );
  const postOwner = useUserProfileStore((state) => state.userProfile);

  const {
    post,
    isLoading: postLoading,
    getPostbyId,
  } = useGetPostByid(notification?.postId);
  const handlePostClick = async () => {
    await getPostbyId(notification.postId);
    setOpenPostModal(true);
    onOpen();
  };

  const handleDelete = () => {
    onDelete(notification.id);
  };

  const deletePost = usePostStore((state) => state.deletePost);
  const decrementPostsCount = useUserProfileStore((state) => state.deletePost);

  const handleDeletePost = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      const imageRef = ref(storage, `posts/${notification.postId}`);
      await deleteObject(imageRef);
      const userRef = doc(firestore, "users", authUser.uid);
      await deleteDoc(doc(firestore, "posts", notification.postId));

      await updateDoc(userRef, {
        posts: arrayRemove(notification.postId),
      });

      const notificationsQuery = query(
        collection(firestore, "notifications"),
        where("postId", "==", notification.postId)
      );
      const notificationsSnapshot = await getDocs(notificationsQuery);

      const batch = writeBatch(firestore);

      notificationsSnapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });

      await batch.commit();

      deletePost(notification.postId);
      decrementPostsCount(notification.postId);

      showToast("Success", "Post deleted successfully", "success");
      onClose();
    } catch (error) {
      console.error(error.message);
      showToast("Error", error.message, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Flex
        p={2}
        borderBottom="1px"
        borderColor="gray.200"
        alignItems="center"
        justifyContent="center"
        gap={2}
      >
        {profileLoading || postLoading ? (
          <Center>
            <Spinner size="xl" />
          </Center>
        ) : (
          <Flex alignItems="center" gap={2} w="full">
            <Link to={`/${userProfile?.username}`}>
              <Box onClick={onClose} cursor={"pointer"}>
                <Avatar.Root>
                  <Avatar.Image src={userProfile?.profilePicURL} />
                  <Avatar.Fallback name={userProfile?.fullName} />
                </Avatar.Root>
              </Box>
            </Link>
            <Text onClick={onClose} cursor={"pointer"}>
              <strong>{userProfile?.fullName}</strong> liked{" "}
              <Text
                as="span"
                color="red.400"
                onClick={handlePostClick}
                cursor="pointer"
              >
                Your Post
              </Text>
              ❤
            </Text>
            <Button
              variant="ghost"
              onClick={handleDelete}
              colorPalette="red"
              size="sm"
              aria-label="Delete notification"
              ml="auto"
            >
              <MdDeleteOutline />
            </Button>
          </Flex>
        )}
      </Flex>

      {openPostModal && post && userProfile && (
        <AppDialogRoot
          isOpen={openPostModal}
          onClose={() => setOpenPostModal(false)}
          size="5xl"
        >
          <AppDialogBackdrop />
          <AppDialogPositioner>
            <AppDialogContent>
              <AppDialogCloseTrigger />
              <AppDialogBody bg={"black"} pb={5}>
                <Flex
                  gap="4"
                  w={{ base: "90%", sm: "70%", md: "full" }}
                  mx={"auto"}
                  maxH={"90vh"}
                  minH={"50vh"}
                >
                  <Flex
                    borderRadius={4}
                    overflow={"hidden"}
                    border={"1px solid"}
                    borderColor={"whiteAlpha.300"}
                    flex={1.5}
                    justifyContent={"center"}
                    alignItems={"center"}
                  >
                    <Image src={post.imageURL} alt="profile post" />
                  </Flex>
                  <Flex
                    flex={1}
                    flexDir={"column"}
                    px={10}
                    display={{ base: "none", md: "flex" }}
                  >
                    <Flex alignItems={"center"} justifyContent={"space-between"}>
                      <Flex alignItems={"center"} gap={4}>
                        <Avatar.Root size={"sm"}>
                          <Avatar.Image src={postOwner.profilePicURL} />
                          <Avatar.Fallback name={postOwner.username} />
                        </Avatar.Root>
                        <Text fontWeight={"bold"} fontSize={12}>
                          {postOwner.username}
                        </Text>
                      </Flex>

                      {authUser?.uid === postOwner.uid && (
                        <Button
                          size={"sm"}
                          bg={"transparent"}
                          _hover={{ bg: "whiteAlpha.300", color: "red.600" }}
                          borderRadius={4}
                          p={1}
                          onClick={handleDeletePost}
                          loading={isDeleting}
                        >
                          <MdDelete size={20} cursor="pointer" />
                        </Button>
                      )}
                    </Flex>
                    <Separator my={4} borderColor={"gray.500"} />

                    <VStack
                      w="full"
                      alignItems={"start"}
                      maxH={"350px"}
                      overflowY={"auto"}
                    >
                      {post.caption && <Caption post={post} key={post.id} />}
                      {post.comments.map((comment) => (
                        <Comment key={comment.id} comment={comment} />
                      ))}
                    </VStack>
                    <Separator my={4} borderColor={"gray.800"} />

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
