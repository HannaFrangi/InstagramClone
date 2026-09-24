import { Text } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { tokenizeText } from "../utils/postText";

// Renders post/comment text with clickable @mentions and #hashtags
const RichText = ({ text, ...props }) => {
  if (!text) return null;

  return (
    <Text as="span" whiteSpace="pre-wrap" wordBreak="break-word" {...props}>
      {tokenizeText(text).map((token, idx) => {
        if (token.type === "text") return token.value;
        const to =
          token.type === "mention"
            ? `/${token.value}`
            : `/tags/${encodeURIComponent(token.value)}`;
        return (
          <Link key={idx} to={to} onClick={(e) => e.stopPropagation()}>
            <Text as="span" color="blue.400" _hover={{ textDecoration: "underline" }}>
              {token.raw}
            </Text>
          </Link>
        );
      })}
    </Text>
  );
};

export default RichText;
