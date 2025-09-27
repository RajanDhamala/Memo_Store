
import { useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import toast from "react-hot-toast";

const ProtectedRoute = ({ isAuth }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuth) {
      toast.error("Please login first to continue!", { id: "auth-error" });
      const timer = setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000); // wait 1s so toast shows

      return () => clearTimeout(timer);
    }
  }, [isAuth, navigate]);

  return isAuth ? <Outlet /> : null;
};

export default ProtectedRoute;

