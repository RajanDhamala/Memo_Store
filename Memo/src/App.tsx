
import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Fallback from "./Fallback";
import { Toaster } from "react-hot-toast";
import useUserStore from "./ZustandStore/UserStore.ts"; // your Zustand store
import ProtectedRoute from "./ProtectedRoutes.tsx";
import { useState } from "react";
import {
  LazyLogin,
  LazyRegister,
  LazyResetPassword,
  LazyForgotPassword,
  LazyUpload,
  LazyLanding,
  LazyFolder,
  LazyFile,
} from "./LazyLoading/LazyLoading";


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
          <Route path="/" element={<LazyLanding/>} />
          <Route path="/login" element={<LazyLogin />} />
          <Route path="/register" element={<LazyRegister />} />
          <Route path="/forgot-password" element={<LazyForgotPassword />} />
          <Route path="/reset-password" element={<LazyResetPassword />} />
          <Route path="/upload" element={<LazyUpload />} />
          <Route path="*" element={<Fallback />} />

          {/* Protected */}
          <Route element={<ProtectedRoute isAuth={isAuthenticated} />}>
            <Route path="/memo" element={<LazyFolder/>} />
            <Route path="/memo/:folderId" element={<LazyFile/>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}
export default App
