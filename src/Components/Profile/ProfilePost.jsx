import {
  Avatar,
  Button,
  Separator,
  Flex,
  GridItem,
  Image,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { AiFillHeart } from "react-icons/ai";
import { FaComment } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import Comment from "../Comment/Comment";
import PostFooter from "../FeedPosts/PostFooter";
import useUserProfileStore from "../../store/userProfileStore";
import useAuthStore from "../../store/authStore";
import useShowToast from "../../hooks/useShowToast";
import { useState } from "react";
import { deleteObject, ref } from "firebase/storage";
import { firestore, storage } from "../../firebase/firebaseConfig";
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
import usePostStore from "../../store/postStore";
import Caption from "../Comment/Caption";
import {
  AppDialogRoot,
  AppDialogBackdrop,
  AppDialogPositioner,
  AppDialogContent,
  AppDialogCloseTrigger,
  AppDialogBody,
} from "../AppDialog.jsx";

const ProfilePost = ({ post }) => {
  const { open, onOpen, onClose } = useDisclosure();
  const userProfile = useUserProfileStore((state) => state.userProfile);
  const authUser = useAuthStore((state) => state.user);
  const showToast = useShowToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const deletePost = usePostStore((state) => state.deletePost);
  const decrementPostsCount = useUserProfileStore((state) => state.deletePost);

  const handleDeletePost = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      const imageRef = ref(storage, `posts/${post.id}`);
      await deleteObject(imageRef);
      const userRef = doc(firestore, "users", authUser.uid);
      await deleteDoc(doc(firestore, "posts", post.id));

      await updateDoc(userRef, {
        posts: arrayRemove(post.id),
      });

      const notificationsQuery = query(
        collection(firestore, "notifications"),
        where("postId", "==", post.id)
      );

      const notificationsSnapshot = await getDocs(notificationsQuery);

      const batch = writeBatch(firestore);

      notificationsSnapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });

      await batch.commit();

      deletePost(post.id);
      decrementPostsCount(post.id);
      showToast("Success", "Post deleted successfully", "success");
    } catch (error) {
      showToast("Error", error.message, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <GridItem
        cursor={"pointer"}
        borderRadius={4}
        overflow={"hidden"}
        border={"1px solid"}
        borderColor={"whiteAlpha.300"}
        position={"relative"}
        aspectRatio={1 / 1}
        onClick={onOpen}
      >
        <Flex
          opacity={0}
          _hover={{ opacity: 1 }}
          position={"absolute"}
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg={"blackAlpha.700"}
          transition={"all 0.3s ease"}
          zIndex={1}
          justifyContent={"center"}
        >
          <Flex alignItems={"center"} justifyContent={"center"} gap={50}>
            <Flex>
              <AiFillHeart size={20} />
              <Text fontWeight={"bold"} ml={2}>
                {post.likes.length}
              </Text>
            </Flex>

            <Flex>
              <FaComment size={20} />
              <Text fontWeight={"bold"} ml={2}>
                {post.comments.length}
              </Text>
            </Flex>
          </Flex>
        </Flex>

        <Image
          src={post.imageURL}
          alt={`${userProfile.username}'s Post`}
          w={"100%"}
          h={"100%"}
          objectFit={"cover"}
        />
      </GridItem>

      <AppDialogRoot isOpen={open} onClose={onClose} size="5xl">
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
                        <Avatar.Image src={userProfile.profilePicURL} />
                        <Avatar.Fallback name={userProfile.username} />
                      </Avatar.Root>
                      <Text fontWeight={"bold"} fontSize={12}>
                        {userProfile.username}
                      </Text>
                    </Flex>

                    {authUser?.uid === userProfile.uid && (
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
    </>
  );
};

export default ProfilePost;
