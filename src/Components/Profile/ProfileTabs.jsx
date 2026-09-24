import { Box, Flex, Text } from "@chakra-ui/react";
import { PROFILE_TABS } from "./profileTabsConfig";

const ProfileTabs = ({ view, onChange, isOwnProfile }) => {
  return (
    <Flex
      w={"full"}
      justifyContent={"center"}
      gap={{ base: 4, sm: 10 }}
      textTransform={"uppercase"}
      fontWeight={"bold"}
    >
      {PROFILE_TABS.filter((tab) => isOwnProfile || !tab.private).map((tab) => (
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
