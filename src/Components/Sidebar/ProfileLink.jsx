import { Avatar, Box, Link, Tooltip, Skeleton } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { MagicalText } from "react-halloween";

const ProfileLink = () => {
  const authUser = useAuthStore((state) => state.user);

  return (
    <Tooltip
      hasArrow
      label={"Profile"}
      placement="right"
      ml={1}
      openDelay={500}
      display={{ base: "block", md: "none" }}
    >
      <Link
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
            <Avatar
              size={"sm"}
              src={authUser.profilePicURL || ""}
              name={authUser.username}
            />
            <Box display={{ base: "none", md: "block" }}>
              <MagicalText text={authUser.username} />
            </Box>
          </>
        ) : (
          <>
            <Skeleton circle size="40px" />
            <Skeleton
              height="20px"
              width="100px"
              display={{ base: "none", md: "block" }}
            />
          </>
        )}
      </Link>
    </Tooltip>
  );
};

export default ProfileLink;
