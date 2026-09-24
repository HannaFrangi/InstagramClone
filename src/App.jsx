import { Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import PageLayout from "./Layout/PageLayout/PageLayout";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase/firebaseConfig";
import { Box, Center, Spinner } from "@chakra-ui/react";
import { AppToaster } from "./lib/AppToaster.jsx";
import { useBookmarksSync } from "./hooks/useBookmarks";

// Each page is its own chunk, downloaded the first time it's visited
const HomePage = lazy(() => import("./Pages/HomePage/HomePage"));
const AuthPage = lazy(() => import("./Pages/AuthPage/AuthPage"));
const ProfilePage = lazy(() => import("./Pages/ProfilePage/ProfilePage"));
const ResetPassword = lazy(() => import("./Pages/ResetPassword/ResetPassword"));
const HashtagPage = lazy(() => import("./Pages/HashtagPage/HashtagPage"));

function App() {
  const [authUser, loading] = useAuthState(auth);
  useBookmarksSync(authUser?.uid);

  if (loading) {
    return (
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
      </Box>
    );
  }

  return (
    <PageLayout>
      <Suspense
        fallback={
          <Center h={"100vh"}>
            <Spinner color="white" />
          </Center>
        }
      >
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
            path="/tags/:tag"
            element={authUser ? <HashtagPage /> : <Navigate to="/auth" />}
          />
          <Route
            path="/:username"
            element={authUser ? <ProfilePage /> : <Navigate to="/auth" />}
          />
        </Routes>
      </Suspense>
      <AppToaster />
    </PageLayout>
  );
}

export default App;
