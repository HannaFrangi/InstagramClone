import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./Pages/HomePage/HomePage";
import AuthPage from "./Pages/AuthPage/AuthPage";
import PageLayout from "./Layout/PageLayout/PageLayout";
import ProfilePage from "./Pages/ProfilePage/ProfilePage";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase/firebaseConfig";
import ResetPassword from "./Pages/ResetPassword/ResetPassword";
import { Box, Spinner } from "@chakra-ui/react";
import Test from "./Pages/Test";

function App() {
  const [authUser, loading] = useAuthState(auth);

  if (loading) {
    <Box
      height={"100vh"}
      borderRight={"1px solid"}
      borderColor={"whiteAlpha.300"}
      py={8}
      position={"sticky"}
      top={0}
      left={0}
      px={{ base: 2, md: 4 }}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Spinner color="white" />
    </Box>;
  }

  return (
    <PageLayout>
      <Routes>
        <Route
          path="/"
          element={authUser ? <HomePage /> : <Navigate to="/auth" />}
        />
        <Route
          path="/auth"
          element={!authUser ? <AuthPage /> : <Navigate to="/" />}
        />
        <Route path="/reset-password/" element={<ResetPassword />} />
        <Route
          path="/:username"
          element={authUser ? <ProfilePage /> : <Navigate to="/auth" />}
        />
        <Route path="/test" element={<Test />} />{" "}
      </Routes>
    </PageLayout>
  );
}

export default App;
