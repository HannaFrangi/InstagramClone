import { Box, Button, Flex, Field, Input, useDisclosure } from "@chakra-ui/react";
import { SearchLogo } from "../../Assets/Contents";
import { useRef } from "react";
import SuggestedUser from "../SuggestedUsers/SuggestedUser";
import useSearchUser from "../../hooks/useSearchUser";
import useShowToast from "../../hooks/useShowToast";
import {
  AppDialogRoot,
  AppDialogBackdrop,
  AppDialogPositioner,
  AppDialogContent,
  AppDialogCloseTrigger,
  AppDialogHeader,
  AppDialogBody,
} from "../AppDialog.jsx";
import { AppTooltip } from "../AppTooltip.jsx";

const Search = () => {
  const { open, onOpen, onClose: chakraOnClose } = useDisclosure();
  const { users, isLoading, getUserProfile, setUsers } = useSearchUser();
  const searchRef = useRef(null);
  const showToast = useShowToast();

  const handleSearchUser = (e) => {
    document.title = "Searching 🔎";
    e.preventDefault();
    const inputValue = searchRef.current.value.trim().toLowerCase();
    if (!inputValue) {
      document.title = "No user";
      return showToast("Error", "Please enter a username", "error");
    }
    getUserProfile(inputValue);
  };

  const handleClose = () => {
    setUsers([]);
    if (searchRef.current) searchRef.current.value = "";
    chakraOnClose();
  };

  return (
    <>
      <AppTooltip
        label="Search"
        placement="right"
        ml={1}
        openDelay={500}
        display={{ base: "block", md: "none" }}
      >
        <Flex
          alignItems="center"
          gap={4}
          _hover={{ bg: "whiteAlpha.400" }}
          borderRadius={6}
          p={2}
          w={{ base: 10, md: "full" }}
          justifyContent={{ base: "center", md: "flex-start" }}
          onClick={onOpen}
        >
          <SearchLogo />
          <Box display={{ base: "none", md: "block" }}>Search</Box>
        </Flex>
      </AppTooltip>

      <AppDialogRoot isOpen={open} onClose={handleClose}>
        <AppDialogBackdrop />
        <AppDialogPositioner>
          <AppDialogContent bg="black" border="1px solid gray" maxW="400px">
            <AppDialogHeader>Search User</AppDialogHeader>
            <AppDialogCloseTrigger />
            <AppDialogBody pb={6}>
              <form onSubmit={handleSearchUser} autoComplete="off">
                <Field.Root>
                  <Field.Label>Username:</Field.Label>
                  <Input
                    placeholder="Frangi"
                    ref={searchRef}
                    type="text"
                    id="searchInput"
                    autoComplete="off"
                    autoFocus={true}
                    autoCorrect="off"
                    autoCapitalize="off"
                  />
                </Field.Root>
                <Flex w="full" justifyContent="flex-end">
                  <Button
                    type="submit"
                    ml="auto"
                    size="sm"
                    my={4}
                    loading={isLoading}
                  >
                    Search
                  </Button>
                </Flex>
              </form>
              {users.length > 0 && (
                <Box mt={4}>
                  {users.map((user) => (
                    <div key={user.uid} onClick={handleClose}>
                      <SuggestedUser user={user} setUser={setUsers} />
                    </div>
                  ))}
                </Box>
              )}
            </AppDialogBody>
          </AppDialogContent>
        </AppDialogPositioner>
      </AppDialogRoot>
    </>
  );
};

export default Search;
