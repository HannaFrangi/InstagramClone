import {
  Avatar,
  Button,
  Center,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
} from '@chakra-ui/react';
import { useRef, useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import usePreviewImg from '../../hooks/usePreviewImage';
import useEditProfile from '../../hooks/useEditProfile';
import useShowToast from '../../hooks/useShowToast';
import { query, collection, where, getDocs } from 'firebase/firestore';
import { firestore } from '../../firebase/firebaseConfig';

const EditProfile = ({ isOpen, onClose }) => {
  const [inputs, setInputs] = useState({
    fullName: '',
    username: '',
    bio: '',
  });
  const authUser = useAuthStore((state) => state.user);
  const fileRef = useRef(null);
  const { handleImageChange, selectedFile, setSelectedFile } = usePreviewImg();
  const { isUpdating, editProfile } = useEditProfile();
  const showToast = useShowToast();

  // Initialize inputs with user data when modal opens
  useEffect(() => {
    if (isOpen) {
      setInputs({
        fullName: authUser.fullName || '',
        username: authUser.username || '',
        bio: authUser.bio || '',
      });
    }
  }, [isOpen, authUser]);

  const checkUsernameAvailability = async (username) => {
    if (!username) return false;
    if (username == authUser.username) return true;
    try {
      const q = query(
        collection(firestore, 'users'),
        where('username', '==', username.toLowerCase())
      );

      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  };

  const handleEditProfile = async () => {
    const isProfileUnchanged =
      inputs.fullName === authUser.fullName &&
      inputs.username === authUser.username &&
      inputs.bio === authUser.bio &&
      !selectedFile;

    if (isProfileUnchanged) {
      showToast('Info', 'No changes made to profile', 'info');
      onClose();
      return;
    }

    if (!inputs.fullName || !inputs.username || !inputs.bio) {
      showToast('Error', 'All fields are required', 'error');
      return;
    }
    if (inputs.username.length < 3) {
      showToast(
        'Error',
        'Username must be at least 3 characters long',
        'error'
      );
      return;
    }
    if (inputs.username.includes(' ')) {
      showToast('Error', 'Username must not contain spaces', 'error');
      return;
    }
    if (inputs.bio.length > 150) {
      showToast('Error', 'Bio must be less than 150 characters', 'error');
      return;
    }
    if (inputs.fullName.length > 50) {
      showToast('Error', 'Full Name must be less than 50 characters', 'error');
      return;
    }
    if (inputs.username.length > 20) {
      showToast('Error', 'Username must be less than 20 characters', 'error');
      return;
    }
    if (inputs.username !== authUser.username) {
      const isUsernameTaken = await checkUsernameAvailability(inputs.username);
      if (isUsernameTaken) {
        showToast('Error', 'Username is already taken', 'error');
        return;
      }
    }
    if (inputs.fullName !== authUser.fullName) {
      const isFullNameTaken = await checkFullNameAvailability(inputs.fullName);
      if (isFullNameTaken) {
        showToast('Error', 'Full Name is already taken', 'error');
        return;
      }
    }
    if (inputs.bio !== authUser.bio) {
      const isBioTaken = await checkBioAvailability(inputs.bio);
      if (isBioTaken) {
        showToast('Error', 'Bio is already taken', 'error');
        return;
      }
    }
    try {
      await editProfile(inputs, selectedFile);
      setSelectedFile(null);
      onClose();
    } catch (error) {
      showToast('Error', error.message, 'error');
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent
          bg={'black'}
          boxShadow={'xl'}
          border={'1px solid gray'}
          mx={3}>
          <ModalHeader />
          <ModalCloseButton />
          <ModalBody>
            {/* Container Flex */}
            <Flex bg={'black'}>
              <Stack
                spacing={4}
                w={'full'}
                maxW={'md'}
                bg={'black'}
                p={6}
                my={0}>
                <Heading lineHeight={1.1} fontSize={{ base: '2xl', sm: '3xl' }}>
                  Edit Profile
                </Heading>
                <FormControl>
                  <Stack direction={['column', 'row']} spacing={6}>
                    <Center>
                      <Avatar
                        size='xl'
                        src={selectedFile || authUser.profilePicURL}
                        border={'2px solid white '}
                        name={authUser.username}
                      />
                    </Center>
                    <Center w='full'>
                      <Button w='full' onClick={() => fileRef.current.click()}>
                        Edit Profile Picture
                      </Button>
                    </Center>
                    <Input
                      type='file'
                      hidden
                      ref={fileRef}
                      onChange={handleImageChange}
                    />
                  </Stack>
                </FormControl>

                <FormControl>
                  <FormLabel fontSize={'sm'}>Full Name </FormLabel>
                  <Input
                    placeholder={'Full Name'}
                    size={'sm'}
                    type={'text'}
                    value={inputs.fullName}
                    onChange={(e) =>
                      setInputs({ ...inputs, fullName: e.target.value })
                    }
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize={'sm'}>Username</FormLabel>
                  <Input
                    placeholder={'Username'}
                    size={'sm'}
                    type={'text'}
                    value={inputs.username}
                    onChange={(e) =>
                      setInputs({ ...inputs, username: e.target.value })
                    }
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize={'sm'}>Bio</FormLabel>
                  <Input
                    placeholder={'Bio'}
                    size={'sm'}
                    type={'text'}
                    value={inputs.bio}
                    onChange={(e) =>
                      setInputs({ ...inputs, bio: e.target.value })
                    }
                  />
                </FormControl>

                <Stack spacing={6} direction={['column', 'row']}>
                  <Button
                    bg={'red.400'}
                    color={'white'}
                    w='full'
                    size='sm'
                    _hover={{ bg: 'red.500' }}
                    onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    bg={'blue.400'}
                    color={'white'}
                    size='sm'
                    w='full'
                    _hover={{ bg: 'blue.500' }}
                    onClick={handleEditProfile}
                    isLoading={isUpdating}>
                    Submit
                  </Button>
                </Stack>
              </Stack>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default EditProfile;
