import { useState, useEffect } from "react";
import {
  Tabs,
  Text,
  Flex,
  VStack,
  Box,
  Avatar,
  Button,
  Center,
  Spinner,
} from "@chakra-ui/react";
import { Link, useParams } from "react-router-dom";
import useGetUserProfileByUsername from "../../hooks/useGetUserProfileByUsername";
import useGetUserProfilesByIds from "../../hooks/useGetUsersProfilesByIds";
import useFollowUser from "../../hooks/useFollowUser";
import {
  AppDialogRoot,
  AppDialogBackdrop,
  AppDialogPositioner,
  AppDialogContent,
  AppDialogCloseTrigger,
  AppDialogHeader,
  AppDialogBody,
} from "../AppDialog.jsx";

const FollowersAndFollowingModal = ({ isOpen, onClose, activeTab }) => {
  const { username } = useParams();
  const [tab, setTab] = useState(
    activeTab === "followers" ? "followers" : "following"
  );
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followerIds, setFollowerIds] = useState([]);
  const [followingIds, setFollowingIds] = useState([]);
  const [listLoading, setListLoading] = useState(true);

  const { userProfile } = useGetUserProfileByUsername(username);

  useEffect(() => {
    setTab(activeTab === "followers" ? "followers" : "following");
  }, [activeTab]);

  useEffect(() => {
    let timeoutId;
    if (isOpen) {
      setListLoading(true);
      timeoutId = setTimeout(() => {
        if (userProfile) {
          setFollowerIds(userProfile.Followers);
          setFollowingIds(userProfile.Following);
        }
      }, 1000);
    }

    return () => clearTimeout(timeoutId);
  }, [isOpen, userProfile]);

  const { userProfiles: followersProfiles } =
    useGetUserProfilesByIds(followerIds);
  const { userProfiles: followingProfiles } =
    useGetUserProfilesByIds(followingIds);

  useEffect(() => {
    if (followersProfiles) {
      setFollowers(followersProfiles);
      setListLoading(false);
    }
  }, [followersProfiles]);

  useEffect(() => {
    if (followingProfiles) {
      setFollowing(followingProfiles);
      setListLoading(false);
    }
  }, [followingProfiles]);

  const handleClose = () => {
    setFollowers([]);
    setFollowing([]);
    setFollowerIds([]);
    setFollowingIds([]);
    onClose();
  };

  if (!userProfile) {
    return null;
  }

  return (
    <AppDialogRoot isOpen={isOpen} onClose={handleClose} size="lg">
      <AppDialogBackdrop />
      <AppDialogPositioner>
        <AppDialogContent bg="black" border="1px solid gray" maxW="500px">
          <AppDialogCloseTrigger />
          <AppDialogHeader>{`${userProfile?.username}'s Connections`}</AppDialogHeader>
          <AppDialogBody>
            <Tabs.Root
              value={tab}
              onValueChange={(e) => setTab(e.value)}
              variant="enclosed"
              colorPalette="purple"
              fitted
            >
              <Tabs.List mb="1em">
                <Tabs.Trigger value="followers" color="white">
                  Followers
                </Tabs.Trigger>
                <Tabs.Trigger value="following" color="white">
                  Following
                </Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="followers">
                {listLoading ? (
                  <Center>
                    <Spinner size="lg" />
                  </Center>
                ) : followers.length === 0 ? (
                  <Center>
                    <Text>No followers yet.</Text>
                  </Center>
                ) : (
                  followers.map((follower) => (
                    <div style={{ marginTop: "20px" }} key={follower.uid}>
                      <Flex
                        justifyContent="space-between"
                        alignItems="center"
                        w="full"
                      >
                        <Flex alignItems="center" gap={2}>
                          <Link
                            to={`/${follower.username}`}
                            onClick={handleClose}
                          >
                            <Avatar.Root size="md">
                              <Avatar.Image src={follower.profilePicURL} />
                              <Avatar.Fallback name={follower.fullName} />
                            </Avatar.Root>
                          </Link>
                          <VStack gap={2} alignItems="flex-start">
                            <Link
                              to={`/${follower.username}`}
                              onClick={handleClose}
                            >
                              <Box fontSize={12} fontWeight="bold">
                                {follower.fullName}
                              </Box>
                            </Link>
                            <Box fontSize={11} color="gray.500">
                              {follower.Followers.length} followers
                            </Box>
                          </VStack>
                        </Flex>
                      </Flex>
                    </div>
                  ))
                )}
              </Tabs.Content>
              <Tabs.Content value="following">
                {listLoading ? (
                  <Center>
                    <Spinner size="lg" />
                  </Center>
                ) : following.length === 0 ? (
                  <Center>
                    <Text>Not following anyone yet.</Text>
                  </Center>
                ) : (
                  following.map((followingUser) => (
                    <Box style={{ marginTop: "20px" }} key={followingUser.uid}>
                      <Flex
                        justifyContent="space-between"
                        alignItems="center"
                        w="full"
                      >
                        <Flex alignItems="center" gap={2}>
                          <Link
                            to={`/${followingUser.username}`}
                            onClick={handleClose}
                          >
                            <Avatar.Root size="md">
                              <Avatar.Image src={followingUser.profilePicURL} />
                              <Avatar.Fallback name={followingUser.fullName} />
                            </Avatar.Root>
                          </Link>
                          <VStack gap={2} alignItems="flex-start">
                            <Link
                              to={`/${followingUser.username}`}
                              onClick={handleClose}
                            >
                              <Box fontSize={12} fontWeight="bold">
                                {followingUser.fullName}
                              </Box>
                            </Link>
                            <Box fontSize={11} color="gray.500">
                              {followingUser.Followers.length} followers
                            </Box>
                          </VStack>
                        </Flex>
                        <FollowUnfollowButton userId={followingUser.uid} />
                      </Flex>
                    </Box>
                  ))
                )}
              </Tabs.Content>
            </Tabs.Root>
          </AppDialogBody>
        </AppDialogContent>
      </AppDialogPositioner>
    </AppDialogRoot>
  );
};

const FollowUnfollowButton = ({ userId }) => {
  const { isUpdating, isFollowing, handleFollowUser } = useFollowUser(userId);

  return (
    <Button
      fontSize={13}
      bg="transparent"
      p={0}
      h="max-content"
      fontWeight="medium"
      color={isFollowing ? "red.400" : "blue.400"}
      cursor="pointer"
      _hover={{ color: "white" }}
      onClick={handleFollowUser}
      loading={isUpdating}
    >
      {isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
};

export default FollowersAndFollowingModal;
