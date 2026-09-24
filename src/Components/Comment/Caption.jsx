import { Avatar, Flex, Text } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { timeAgo } from "../../utils/timeAgo.js";
import useGetUserProfileById from "../../hooks/useGetUserProfileById";
import RichText from "../RichText";

const Caption = ({ post }) => {
  const { userProfile } = useGetUserProfileById(post.createdBy);
  if (!userProfile) return null;

  return (
    <Flex gap={4}>
      <Link to={`/${userProfile.username}`}>
        <Avatar.Root size={'sm'}>
          <Avatar.Image src={userProfile.profilePicURL || undefined} />
          <Avatar.Fallback name={userProfile.username} />
        </Avatar.Root>
      </Link>
      <Flex direction={'column'}>
        <Flex gap={2} alignItems={'center'}>
          <Link to={`/${userProfile.username}`}>
            <Text fontWeight={'bold'} fontSize={12}>
              {userProfile.username}
            </Text>
          </Link>
          <Text fontSize={14}>
            <RichText text={post.caption} />
          </Text>
        </Flex>
        <Text fontSize={12} color={'gray'}>
          {timeAgo(post.createdAt)}
        </Text>
      </Flex>
    </Flex>
  );
};

export default Caption;
