import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Text,
  Flex,
  VStack,
  Box,
  Avatar,
  Button,
  Center,
} from "@chakra-ui/react";
import { useParams, Link } from "react-router-dom";
import useGetUserProfileByUsername from "../../hooks/useGetUserProfileByUsername";
import useGetUserProfilesByIds from "../../hooks/useGetUsersProfilesByIds";
import useFollowUser from "../../hooks/useFollowUser";

const FollowersAndFollowingModal = ({ isOpen, onClose, activeTab }) => {
  const { username } = useParams();
  const [tabIndex, setTabIndex] = useState(activeTab === "followers" ? 0 : 1);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followerIds, setFollowerIds] = useState([]);
  const [followingIds, setFollowingIds] = useState([]);

  const { userProfile } = useGetUserProfileByUsername(username);

  useEffect(() => {
    setTabIndex(activeTab === "followers" ? 0 : 1);
  }, [activeTab]);

  useEffect(() => {
    if (userProfile) {
      setFollowerIds(userProfile.Followers);
      setFollowingIds(userProfile.Following);
    }
  }, [userProfile]);

  const { userProfiles: followersProfiles } =
    useGetUserProfilesByIds(followerIds);
  const { userProfiles: followingProfiles } =
    useGetUserProfilesByIds(followingIds);

  useEffect(() => {
    setFollowers(followersProfiles || []);
  }, [followersProfiles]);

  useEffect(() => {
    setFollowing(followingProfiles || []);
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
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent bg={"black"} border={"1px solid gray"} maxW={"500px"}>
        <ModalHeader>{userProfile?.username}'s Connections</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Tabs
            isFitted
            variant="soft-rounded"
            colorScheme="purple"
            index={tabIndex}
            onChange={(index) => setTabIndex(index)}
          >
            <TabList mb="1em">
              <Tab color={"white"}>Followers</Tab>
              <Tab color={"white"}>Following</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                {followers.length === 0 ? (
                  <Center>
                    <Text>No followers yet.</Text>
                  </Center>
                ) : (
                  followers.map((follower) => (
                    <div style={{ marginTop: "20px" }} key={follower.uid}>
                      <Flex
                        justifyContent={"space-between"}
                        alignItems={"center"}
                        w={"full"}
                      >
                        <Flex alignItems={"center"} gap={2}>
                          <Link
                            to={`/${follower.username}`}
                            onClick={handleClose}
                          >
                            <Avatar src={follower.profilePicURL} size={"md"} />
                          </Link>
                          <VStack spacing={2} alignItems={"flex-start"}>
                            <Link
                              to={`/${follower.username}`}
                              onClick={handleClose}
                            >
                              <Box fontSize={12} fontWeight={"bold"}>
                                {follower.fullName}
                              </Box>
                            </Link>
                            <Box fontSize={11} color={"gray.500"}>
                              {follower.Followers.length} followers
                            </Box>
                          </VStack>
                        </Flex>
                      </Flex>
                    </div>
                  ))
                )}
              </TabPanel>
              <TabPanel>
                {following.length === 0 ? (
                  <Center>
                    <Text>Not following anyone yet.</Text>
                  </Center>
                ) : (
                  following.map((followingUser) => (
                    <div style={{ marginTop: "20px" }} key={followingUser.uid}>
                      <Flex
                        justifyContent={"space-between"}
                        alignItems={"center"}
                        w={"full"}
                      >
                        <Flex alignItems={"center"} gap={2}>
                          <Link
                            to={`/${followingUser.username}`}
                            onClick={handleClose}
                          >
                            <Avatar
                              src={followingUser.profilePicURL}
                              size={"md"}
                            />
                          </Link>
                          <VStack spacing={2} alignItems={"flex-start"}>
                            <Link
                              to={`/${followingUser.username}`}
                              onClick={handleClose}
                            >
                              <Box fontSize={12} fontWeight={"bold"}>
                                {followingUser.fullName}
                              </Box>
                            </Link>
                            <Box fontSize={11} color={"gray.500"}>
                              {followingUser.Followers.length} followers
                            </Box>
                          </VStack>
                        </Flex>
                        <FollowUnfollowButton userId={followingUser.uid} />{" "}
                        {/* Use uid */}
                      </Flex>
                    </div>
                  ))
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const FollowUnfollowButton = ({ userId }) => {
  const { isUpdating, isFollowing, handleFollowUser } = useFollowUser(userId);

  return (
    <Button
      fontSize={13}
      bg={"transparent"}
      p={0}
      h={"max-content"}
      fontWeight={"medium"}
      color={isFollowing ? "red.400" : "blue.400"}
      cursor={"pointer"}
      _hover={{ color: "white" }}
      onClick={handleFollowUser}
      isLoading={isUpdating}
    >
      {isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
};

export default React.memo(FollowersAndFollowingModal);
