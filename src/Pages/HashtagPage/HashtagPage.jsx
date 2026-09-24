import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Container, Heading, Skeleton, Text, VStack } from "@chakra-ui/react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { firestore } from "../../firebase/firebaseConfig";
import FeedPost from "../../Components/FeedPosts/FeedPost";

const HashtagPage = () => {
  const tag = useParams().tag.toLowerCase();
  const [result, setResult] = useState({ forTag: null, posts: [], error: null });
  const isLoading = result.forTag !== tag;

  useEffect(() => {
    document.title = `#${tag}`;
  }, [tag]);

  useEffect(() => {
    return onSnapshot(
      query(collection(firestore, "posts"), where("hashtags", "array-contains", tag)),
      (snapshot) => {
        const posts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        posts.sort((a, b) => b.createdAt - a.createdAt);
        setResult({ forTag: tag, posts, error: null });
      },
      (error) => setResult({ forTag: tag, posts: [], error: error.message })
    );
  }, [tag]);

  return (
    <Container maxW={"container.sm"} py={10} px={2}>
      <Heading size={"2xl"} mb={1}>
        #{tag}
      </Heading>
      {!isLoading && !result.error && (
        <Text color={"gray.500"} fontSize={"sm"} mb={6}>
          {result.posts.length} {result.posts.length === 1 ? "post" : "posts"}
        </Text>
      )}

      {isLoading && (
        <VStack gap={4} mt={6}>
          {[0, 1, 2].map((idx) => (
            <Skeleton key={idx} w={"full"} h={"200px"} />
          ))}
        </VStack>
      )}
      {result.error && <Text color={"red.400"}>{result.error}</Text>}
      {!isLoading && !result.error && result.posts.length === 0 && (
        <Text color={"gray.500"}>No posts with #{tag} yet.</Text>
      )}
      {!isLoading && result.posts.map((post) => <FeedPost key={post.id} post={post} />)}
    </Container>
  );
};

export default HashtagPage;
