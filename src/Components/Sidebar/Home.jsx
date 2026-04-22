import { Box } from "@chakra-ui/react";
import { AiFillHome } from "react-icons/ai";
import { Link as RouterLink } from "react-router-dom";
import { AppTooltip } from "../AppTooltip.jsx";

const Home = () => {
  return (
    <AppTooltip
      label={"Home"}
      placement="right"
      ml={1}
      openDelay={500}
      display={{ base: "block", md: "none" }}
    >
      <Box
        as={RouterLink}
        display={"flex"}
        to={"/"}
        alignItems={"center"}
        gap={4}
        _hover={{ bg: "whiteAlpha.400" }}
        borderRadius={6}
        p={2}
        w={{ base: 10, md: "full" }}
        justifyContent={{ base: "center", md: "flex-start" }}
      >
        <AiFillHome size={25} />
        <Box display={{ base: "none", md: "block" }}>Home</Box>
      </Box>
    </AppTooltip>
  );
};

export default Home;
