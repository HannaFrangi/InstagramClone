import { LuEye, LuEyeOff } from "react-icons/lu";
import {
  Alert,
  Button,
  Input,
  InputGroup,
} from "@chakra-ui/react";
import { useState } from "react";
import useSignUpWithEmailNPass from "../../hooks/useSignUpWithEmailNPass";

const Signup = () => {
  const [inputs, setInputs] = useState({
    fullName: "",
    email: "",
    password: "",
    username: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const { loading, error, signup } = useSignUpWithEmailNPass();
  return (
    <>
      <Input
        placeholder='Email'
        fontSize={14}
        type='email'
        value={inputs.email}
        onChange={(e) => setInputs({ ...inputs, email: e.target.value })}
        size={"sm"}
      />
      <Input
        placeholder='username'
        fontSize={14}
        type='text'
        value={inputs.username}
        onChange={(e) => setInputs({ ...inputs, username: e.target.value })}
        size={"sm"}
      />{" "}
      <Input
        placeholder='full Name'
        fontSize={14}
        type='text'
        value={inputs.fullName}
        onChange={(e) => setInputs({ ...inputs, fullName: e.target.value })}
        size={"sm"}
      />
      <InputGroup
        endElement={
          <Button
            variant={"ghost"}
            size={"sm"}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <LuEyeOff /> : <LuEye />}
          </Button>
        }
      >
        <Input
          placeholder='Password'
          fontSize={14}
          type={showPassword ? "text" : "password"}
          value={inputs.password}
          onChange={(e) => setInputs({ ...inputs, password: e.target.value })}
          size={"sm"}
        />
      </InputGroup>
      {error && (
        <Alert.Root status='error' fontSize={13} p={2} borderRadius={4}>
          <Alert.Indicator fontSize={12} />
          <Alert.Description>{error.message}</Alert.Description>
        </Alert.Root>
      )}
      <Button
        w={"full"}
        colorPalette='blue'
        size={"sm"}
        fontSize={14}
        onClick={() => signup(inputs)}
        loading={loading}
      >
        Sign Up
      </Button>
    </>
  );
};

export default Signup;
