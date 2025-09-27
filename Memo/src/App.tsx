
import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./Pages/Landing";
import Fallback from "./Fallback";
import LoginPage from "./Pages/Login";
import RegisterPage from "./Pages/Register";
import ForgotPasswordPage from "./Pages/ForgotPassword";
import { Toaster } from "react-hot-toast";
import useUserStore from "./ZustandStore/UserStore.ts"; // your Zustand store
import { FoldersView } from "./Comps/Folders.tsx";
import { FilesView } from "./Comps/Files.tsx";
import ResetPasswordPage from "./Pages/ResetPassword.tsx";
import UploadFilePage from "./Pages/UploadFile.tsx";
import ProtectedRoute from "./ProtectedRoutes.tsx";
import { useState } from "react";

function App() {
  const { setIsAuthenticated, setCurrentUser, isAuthenticated } = useUserStore();
  const [loading, setLoading] = useState(true); // 🔥 new

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BASE_URL}/user/me`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();

        if (data.success && data.user) {
          setCurrentUser(data.user);
          setIsAuthenticated(true);
        } else {
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        setCurrentUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false); 
      }
    };

    fetchCurrentUser();
  }, [setCurrentUser, setIsAuthenticated]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/upload" element={<UploadFilePage />} />
          <Route path="*" element={<Fallback />} />

          {/* Protected */}
          <Route element={<ProtectedRoute isAuth={isAuthenticated} />}>
            <Route path="/memo" element={<FoldersView />} />
            <Route path="/memo/:folderId" element={<FilesView />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}
export default App
