import {
  Box,
  Button,
  Container,
  Flex,
  Skeleton,
  SkeletonCircle,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import FeedPost from "./FeedPost";
import useGetFeedPosts from "../../hooks/useGetFeedPosts";

const FeedPosts = () => {
  const { isLoading, isLoadingMore, hasMore, posts, error, loadMore, refresh } =
    useGetFeedPosts();
  const sentinelRef = useRef(null);
  const loadMoreRef = useRef(loadMore);
  useEffect(() => {
    loadMoreRef.current = loadMore;
  });

  // Load the next page when the bottom of the feed scrolls into view
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreRef.current();
      },
      { rootMargin: "600px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isLoading, hasMore]);

  return (
    <Container maxW={'container.sm'} py={10} px={2}>
      {isLoading &&
        [0, 1, 2].map((_, idx) => (
          <VStack key={idx} gap={4} alignItems={'flex-start'} mb={10}>
            <Flex gap='2'>
              <SkeletonCircle size='10' />
              <VStack gap={2} alignItems={'flex-start'}>
                <Skeleton height='10px' w={'200px'} />
                <Skeleton height='10px' w={'200px'} />
              </VStack>
            </Flex>
            <Skeleton w={'full'}>
              <Box h={'400px'}>contents wrapped</Box>
            </Skeleton>
          </VStack>
        ))}

      {!isLoading && error && (
        <Text fontSize={'md'} color={'red.400'}>
          Oops! Something went wrong. Please try again later.
        </Text>
      )}

      {!isLoading &&
        posts.length > 0 &&
        posts.map((post) => <FeedPost key={post.id} post={post} />)}

      {!isLoading && posts.length > 0 && (
        <Flex justifyContent={'center'} py={6} ref={sentinelRef}>
          {hasMore ? (
            <Button
              variant={'ghost'}
              size={'sm'}
              onClick={loadMore}
              loading={isLoadingMore}>
              Load more
            </Button>
          ) : (
            <Text fontSize={'sm'} color={'gray.500'}>
              You&apos;re all caught up 🎉
            </Text>
          )}
        </Flex>
      )}

      {!isLoading && !error && posts.length === 0 && (
        <>
          <Text fontSize={'md'} color={'red.400'}>
            No posts yet. Follow people to see their posts here.
          </Text>
          <Text color={'red.400'}>Go Follow Someone 🙁</Text>
          <Button onClick={refresh} colorPalette='blue' mt={4}>
            Refresh Feed
          </Button>
        </>
      )}
    </Container>
  );
};

export default FeedPosts;
