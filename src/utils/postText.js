// Splits post/comment text into plain text, @mentions and #hashtags.
// Usernames are stored lowercase, so matches are normalised the same way.
const TOKEN_REGEX = /([@#])([\p{L}\p{N}_.]+)/gu;

export const tokenizeText = (text = "") => {
  const tokens = [];
  let lastIndex = 0;

  for (const match of text.matchAll(TOKEN_REGEX)) {
    // "@bob." at the end of a sentence means "bob"
    const value = match[2].replace(/\.+$/, "");
    if (!value) continue;

    const start = match.index;
    const end = start + 1 + value.length;
    // Skip e-mail addresses and the like: "a@b" is not a mention
    if (start > 0 && /[\p{L}\p{N}_]/u.test(text[start - 1])) continue;

    if (start > lastIndex) {
      tokens.push({ type: "text", value: text.slice(lastIndex, start) });
    }
    tokens.push({
      type: match[1] === "@" ? "mention" : "hashtag",
      value: value.toLowerCase(),
      raw: text.slice(start, end),
    });
    lastIndex = end;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: "text", value: text.slice(lastIndex) });
  }
  return tokens;
};

const uniqueValues = (text, type) => [
  ...new Set(
    tokenizeText(text)
      .filter((token) => token.type === type)
      .map((token) => token.value)
  ),
];

export const extractHashtags = (text) => uniqueValues(text, "hashtag");
export const extractMentions = (text) => uniqueValues(text, "mention");
