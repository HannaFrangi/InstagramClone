import { Box, Button, Flex, Link, Tooltip, Spinner } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { InstagramLogo, InstagramMobileLogo } from "../../Assets/Contents";
import { BiLogOut } from "react-icons/bi";
import useLogout from "../../hooks/useLogOut";
import SidebarItems from "./SidebarItems";
import { useEffect, useState } from "react";
import { Eyes } from "react-halloween";
import { motion } from "framer-motion";

const Sidebar = () => {
  const { handleLogout, isLoggingOut } = useLogout();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <Box
        height={"100vh"}
        borderRight={"1px solid"}
        borderColor={"whiteAlpha.300"}
        py={8}
        position={"sticky"}
        top={0}
        left={0}
        px={{ base: 2, md: 4 }}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Spinner color="white" />
      </Box>
    );
  }

  return (
    <Box
      height={"100vh"}
      borderRight={"1px solid"}
      borderColor={"whiteAlpha.300"}
      py={8}
      position={"sticky"}
      top={0}
      left={0}
      px={{ base: 2, md: 4 }}
      bgGradient="linear(to-b, #0D0D0D, #1A1A1A)"
      overflow="hidden"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2, y: [0, 20, 0] }}
        transition={{ repeat: Infinity, duration: 8 }}
        style={{
          position: "absolute",
          top: "30%",
          left: "10%",
          width: "200px",
          height: "200px",
          backgroundImage: 'url("/path-to-ghost.png")',
          backgroundSize: "contain",
          zIndex: 0,
        }}
      />

      <Flex direction={"column"} gap={10} w="full" height={"full"} zIndex={1}>
        {/* Logo with spooky animated eyes */}
        <Link
          to={"/"}
          as={RouterLink}
          pl={2}
          display={{ base: "none", md: "block" }}
          cursor="pointer"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Eyes
              irisColor={"#A020F0"}
              irisMotion="look-around"
              eyeBallColor={"red"}
            />{" "}
            {/* Halloween Eyes */}
          </motion.div>
        </Link>

        {/* Mobile logo */}
        <Link
          to={"/"}
          as={RouterLink}
          p={2}
          display={{ base: "block", md: "none" }}
          borderRadius={6}
          _hover={{
            bg: "whiteAlpha.200",
          }}
          w={10}
          cursor="pointer"
        >
          <InstagramMobileLogo />
        </Link>

        <Flex direction={"column"} gap={5} cursor={"pointer"}>
          <SidebarItems />
        </Flex>

        {/* LOGOUT */}
        <Tooltip
          hasArrow
          label={"Logout"}
          placement="right"
          ml={1}
          openDelay={500}
          color="black"
          display={{ base: "block", md: "none" }}
        >
          <Flex
            onClick={handleLogout}
            alignItems={"center"}
            gap={4}
            _hover={{ bg: "whiteAlpha.400", transform: "scale(1.05)" }}
            borderRadius={6}
            p={2}
            w={{ base: 10, md: "full" }}
            mt={"auto"}
            justifyContent={{ base: "center", md: "flex-start" }}
            transition="transform 0.3s ease-in-out"
          >
            <BiLogOut size={25} />
            <Button
              display={{ base: "none", md: "block" }}
              variant={"ghost"}
              _hover={{ bg: "transparent" }}
              isLoading={isLoggingOut}
            >
              Logout
            </Button>
          </Flex>
        </Tooltip>
      </Flex>
    </Box>
  );
};

export default Sidebar;
