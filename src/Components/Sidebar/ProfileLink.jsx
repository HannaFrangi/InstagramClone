import { Avatar, Box, Skeleton, SkeletonCircle } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { MagicalText } from "react-halloween";
import { AppTooltip } from "../AppTooltip.jsx";

const ProfileLink = () => {
  const authUser = useAuthStore((state) => state.user);

  return (
    <AppTooltip
      label={"Profile"}
      placement="right"
      ml={1}
      openDelay={500}
      display={{ base: "block", md: "none" }}
    >
      <Box
        display={"flex"}
        to={authUser ? `/${authUser.username}` : "#"}
        as={RouterLink}
        alignItems={"center"}
        gap={4}
        _hover={{ bg: "whiteAlpha.400" }}
        borderRadius={6}
        p={2}
        w={{ base: 10, md: "full" }}
        justifyContent={{ base: "center", md: "flex-start" }}
      >
        {authUser ? (
          <>
            <Avatar.Root size={"sm"}>
              <Avatar.Image src={authUser.profilePicURL || ""} />
              <Avatar.Fallback name={authUser.username} />
            </Avatar.Root>
            <Box display={{ base: "none", md: "block" }}>
              <MagicalText text={authUser.username} />
            </Box>
          </>
        ) : (
          <>
            <SkeletonCircle size="40px" />
            <Skeleton
              height="20px"
              width="100px"
              display={{ base: "none", md: "block" }}
            />
          </>
        )}
      </Box>
    </AppTooltip>
  );
};

export default ProfileLink;
