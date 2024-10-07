import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./Pages/HomePage/HomePage";
import AuthPage from "./Pages/AuthPage/AuthPage";
import PageLayout from "./Layout/PageLayout/PageLayout";
import ProfilePage from "./Pages/ProfilePage/ProfilePage";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase/firebaseConfig";
import ResetPassword from "./Pages/ResetPassword/ResetPassword";

function App() {
  const [authUser, loading] = useAuthState(auth);

  // If still loading user authentication state, you can show a loader or placeholder.
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <PageLayout>
      <Routes>
        <Route
          path='/'
          element={authUser ? <HomePage /> : <Navigate to='/auth' />}
        />
        <Route
          path='/auth'
          element={!authUser ? <AuthPage /> : <Navigate to='/' />}
        />
        <Route path='/reset-password/' element={<ResetPassword />} />
        <Route
          path='/:username'
          element={authUser ? <ProfilePage /> : <Navigate to='/auth' />}
        />
      </Routes>
    </PageLayout>
  );
}

export default App;
