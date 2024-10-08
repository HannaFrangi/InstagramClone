import {
  Box,
  Button,
  Container,
  Flex,
  Link,
  Skeleton,
  SkeletonCircle,
  Text,
  useBreakpointValue,
  VStack,
} from "@chakra-ui/react";
import ProfileHeader from "../../Components/Profile/ProfileHeader";
import ProfileTabs from "../../Components/Profile/ProfileTabs";
import ProfilePosts from "../../Components/Profile/ProfilePosts";
import useGetUserProfileByUsername from "../../hooks/useGetUserProfileByUsername";
import {
  useParams,
  useNavigate,
  Link as RouterLink,
  useLocation,
} from "react-router-dom";
import { useEffect } from "react";
import { BiConfused } from "react-icons/bi";

const ProfilePage = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { isLoading, userProfile } = useGetUserProfileByUsername(username);
  const pathname = useLocation();

  if (pathname == "/auth") return;

  useEffect(() => {
    const lowerCaseUsername = username.toLowerCase();
    if (username !== lowerCaseUsername) {
      navigate(`/${lowerCaseUsername}`, { replace: true });
    }
  }, [username, navigate]);

  useEffect(() => {
    if (userProfile) {
      document.title = `${userProfile.username}'s Profile🔥`;
    } else {
      document.title = "User Not Found";
    }
  }, [userProfile]);

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
  const buttonSize = useBreakpointValue({ base: "md", md: "lg" });

  return (
    <Flex
      flexDir='column'
      justify='center'
      align='center'
      h='100vh'
      textAlign='center'
      mx='auto'
      bg='black'
      p={4}
      borderRadius='md'
      boxShadow='lg'
      transition='0.3s ease'
    >
      <Box p={6} bg='black' borderRadius='md' boxShadow='xl' maxW='400px'>
        <Flex direction='column' align='center'>
          <BiConfused size={64} color='white' />
          <Text fontSize='4xl' fontWeight='bold' mb={4} color='white'>
            User Not Found
          </Text>
          <Text mb={6} color='gray.300'>
            The user you are looking for does not exist. It might have been
            deleted or never existed.
          </Text>
          <Link
            as={RouterLink}
            to='/'
            w='max-content'
            mx='auto'
            fontWeight='bold'
            fontSize='lg'
          >
            <Button
              colorScheme='teal'
              size={buttonSize}
              _hover={{ bg: "teal.600", transform: "translateY(-2px)" }}
              transition='0.3s ease'
            >
              Go Home
            </Button>
          </Link>
        </Flex>
      </Box>
    </Flex>
  );
};
