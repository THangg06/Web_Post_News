import { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Avatar from "./Avatar";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isLoggedIn, logout } = useContext(AuthContext);
  const isAdmin = Boolean(currentUser?.is_staff || currentUser?.is_superuser || currentUser?.role === "admin");
  const [showMenu, setShowMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get("q") || "";
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchTerm(params.get("q") || "");
  }, [location.search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(location.search);
    const keyword = searchTerm.trim();
    console.log("Submitting search with keyword:", keyword);
    if (keyword) {
      params.set("q", keyword);
    } else {
      params.delete("q");
    }
    const nextQuery = params.toString();
    console.log("Navigating to:", nextQuery ? `/?${nextQuery}` : "/");
    navigate(nextQuery ? `/?${nextQuery}` : "/");
  };

  return (
    <div className="bg-white shadow-md px-6 py-3 flex justify-between items-center sticky top-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <Link
              to="/"
              className="text-2xl font-bold text-gray-900"
            >
              ABC News
            </Link>
      </div>

      {/* Search Bar */}
      <div className="flex-1 mx-6 max-w-md">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Search by title or author..."
            className="bg-gray-100 px-4 py-2 rounded-full w-full outline-none focus:bg-gray-200 transition"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-full bg-gray-600 text-white font-semibold hover:bg-gray-800 transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Right side - Actions */}
      <div className="flex gap-6 items-center">
        {!isLoggedIn && (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              Sign up
            </Link>
          </div>
        )}

        {isLoggedIn && currentUser && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 hover:bg-gray-100 px-3 py-2 rounded-lg transition"
            >
              <Avatar
                src="/default-avatar.svg"
                alt="Profile"
                size="sm"
              />
              <span className="font-medium">{currentUser.username}</span>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg w-48">
                <Link to="/profile" className="block px-4 py-2 hover:bg-gray-100 text-gray-800">
                  👤 Profile
                </Link>
                  {isAdmin && (
                    <Link to="/moderation" className="block px-4 py-2 hover:bg-gray-100 text-gray-800 border-t">
                      🛡️ Admin dashboard
                    </Link>
                  )}
                {/* <Link to="/profile" className="block px-4 py-2 hover:bg-gray-100 text-gray-800">
                  ⚙️ Cài đặt
                </Link> */}
                <button
                  onClick={() => {
                    logout();
                    navigate("/logout");
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-800 border-t"
                >
                  🚪 Log out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Navbar;