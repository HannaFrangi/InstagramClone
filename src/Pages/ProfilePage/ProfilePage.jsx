import {
  Container,
  Flex,
  Link,
  Skeleton,
  SkeletonCircle,
  Text,
  VStack,
} from "@chakra-ui/react";
import ProfileHeader from "../../Components/Profile/ProfileHeader";
import ProfileTabs from "../../Components/Profile/ProfileTabs";
import ProfilePosts from "../../Components/Profile/ProfilePosts";
import useGetUserProfileByUsername from "../../hooks/useGetUserProfileByUsername";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import { useEffect } from "react";

const ProfilePage = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { isLoading, userProfile } = useGetUserProfileByUsername(username);

  // Redirect to lowercase username if the current one has uppercase letters
  useEffect(() => {
    const lowerCaseUsername = username.toLowerCase();
    if (username !== lowerCaseUsername) {
      navigate(`/${lowerCaseUsername}`, { replace: true });
    }
  }, [username, navigate]);

  const userNotFound = !isLoading && !userProfile;
  if (userNotFound) return <UserNotFound />;

  return (
    <Container maxW='container.lg' py={5}>
      <Flex
        py={10}
        px={4}
        pl={{ base: 4, md: 10 }}
        w='full'
        mx='auto'
        flexDirection='column'
      >
        {!isLoading && userProfile && (
          <ProfileHeader userProfile={userProfile} />
        )}
        {isLoading && <ProfileHeaderSkeleton />}
      </Flex>
      <Flex
        px={{ base: 2, sm: 4 }}
        maxW='full'
        mx='auto'
        borderTop='1px solid'
        borderColor='whiteAlpha.300'
        direction='column'
      >
        <ProfileTabs userProfile={userProfile} isLoading={isLoading} />
        <ProfilePosts userProfile={userProfile} isLoading={isLoading} />
      </Flex>
    </Container>
  );
};

export default ProfilePage;

// Skeleton for profile header
const ProfileHeaderSkeleton = () => {
  return (
    <Flex
      gap={{ base: 4, sm: 10 }}
      py={10}
      direction={{ base: "column", sm: "row" }}
      justifyContent='center'
      alignItems='center'
    >
      <SkeletonCircle size='24' />
      <VStack
        alignItems={{ base: "center", sm: "flex-start" }}
        gap={2}
        mx='auto'
        flex={1}
      >
        <Skeleton height='12px' width='150px' />
        <Skeleton height='12px' width='100px' />
      </VStack>
    </Flex>
  );
};

// Component for user not found case
const UserNotFound = () => {
  return (
    <Flex
      flexDir='column'
      justify='center'
      align='center'
      h='100vh'
      textAlign='center'
      mx='auto'
    >
      <Text fontSize='2xl' mb={4}>
        User Not Found
      </Text>
      <Link
        as={RouterLink}
        to='/'
        color='blue.500'
        w='max-content'
        mx='auto'
        fontWeight='bold'
        fontSize='lg'
      >
        Go home
      </Link>
    </Flex>
  );
};
