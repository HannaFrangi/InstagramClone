import { Box, Flex, Text } from "@chakra-ui/react";
import { BsGrid3X3, BsTextParagraph } from "react-icons/bs";

const TABS = [
  { value: "posts", label: "Posts", icon: <BsTextParagraph /> },
  { value: "media", label: "Media", icon: <BsGrid3X3 /> },
];

const ProfileTabs = ({ view, onChange }) => {
  return (
    <Flex
      w={"full"}
      justifyContent={"center"}
      gap={{ base: 4, sm: 10 }}
      textTransform={"uppercase"}
      fontWeight={"bold"}
    >
      {TABS.map((tab) => (
        <Flex
          key={tab.value}
          as="button"
          borderTop={"1px solid"}
          borderColor={view === tab.value ? "white" : "transparent"}
          color={view === tab.value ? "white" : "gray.500"}
          alignItems={"center"}
          p='3'
          gap={1}
          cursor={"pointer"}
          onClick={() => onChange(tab.value)}
        >
          <Box fontSize={20}>{tab.icon}</Box>
          <Text fontSize={12} display={{ base: "none", sm: "block" }}>
            {tab.label}
          </Text>
        </Flex>
      ))}
    </Flex>
  );
};

export default ProfileTabs;
