import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearCurrentUser } from "../services/auth";
import { logoutUser } from "../services/api";

function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await logoutUser();
      } catch {
        // Ignore backend logout failures in local dev.
      } finally {
        clearCurrentUser();
        navigate("/login", { replace: true });
      }
    };

    handleLogout();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="rounded-lg bg-white px-6 py-4 shadow-md text-gray-700">
        Logging out...
      </div>
    </div>
  );
}

export default Logout;
