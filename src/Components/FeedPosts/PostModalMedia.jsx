import { Box, Image } from "@chakra-ui/react";
import RichText from "../RichText";
import QuotedPost from "./QuotedPost";

// Left side of the post pop-up: the image, or the text (and quoted post)
const PostModalMedia = ({ post }) =>
  post.imageURL ? (
    <Image src={post.imageURL} alt="profile post" />
  ) : (
    <Box p={6} w="full">
      <Box fontSize="lg" mb={4}>
        <RichText text={post.caption} />
      </Box>
      {post.repostOf && <QuotedPost postId={post.repostOf} />}
    </Box>
  );

export default PostModalMedia;
