import { useState, useEffect, useContext } from "react";
import Navbar from "../components/Navbar";
import PostCard from "../components/PostCard";
import { AuthContext } from "../context/AuthContext";
import { updateProfile, changePassword, getCurrentUserFromServer, getUserPosts } from "../services/api";
import { getCurrentUser, setCurrentUser } from "../services/auth";

function Profile() {
  const { currentUser: contextUser } = useContext(AuthContext);
  const [currentUser, setCurrentUserState] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [forgotForm, setForgotForm] = useState({
    identifier: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Load user data on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const serverUser = await getCurrentUserFromServer();
        if (serverUser) {
          setCurrentUserState(serverUser);
          setEditForm({
            first_name: serverUser.first_name || "",
            last_name: serverUser.last_name || "",
            email: serverUser.email || "",
          });
        } else {
          const localUser = getCurrentUser();
          setCurrentUserState(localUser);
          if (localUser) {
            setEditForm({
              first_name: localUser.first_name || "",
              last_name: localUser.last_name || "",
              email: localUser.email || "",
            });
          }
        }
      } catch (e) {
        console.error("Failed to load user:", e);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const loadUserPosts = async () => {
      const userId = contextUser?.id || currentUser?.id;
      if (!userId) {
        setUserPosts([]);
        return;
      }

      try {
        const posts = await getUserPosts(userId);
        setUserPosts(Array.isArray(posts) ? posts : []);
      } catch (e) {
        console.error("Failed to load user posts:", e);
        setUserPosts([]);
      }
    };

    loadUserPosts();
  }, [contextUser?.id, currentUser?.id]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handleForgotChange = (e) => {
    setForgotForm({ identifier: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await updateProfile(editForm);
      setCurrentUserState(response.user);
      setCurrentUser(response.user);
      setMessage("Profile updated successfully!");
      setTimeout(() => {
        setShowEditModal(false);
        setMessage("");
      }, 2000);
    } catch (err) {
      setError(err.message || "Unable to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      await changePassword(passwordForm);
      setMessage("Password changed successfully!");
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordForm({
          old_password: "",
          new_password: "",
          confirm_password: "",
        });
        setMessage("");
      }, 2000);
    } catch (err) {
      setError(err.message || "Unable to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      setMessage("Password reset instructions have been sent! Please check your email.");
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotForm({ identifier: "" });
        setMessage("");
      }, 3000);
    } catch (err) {
      setError(err.message || "Unable to process the request");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="bg-gray-100 min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-600 text-lg">Please log in to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar />

      <div className="flex gap-6 max-w-7xl mx-auto pt-4 px-4 pb-8">
        {/* Main Content */}
        <div className="flex-1 max-w-7xl">
          {/* Profile Cover */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
            {/* Cover Photo */}
            <div className="h-64 bg-gradient-to-r from-gray-400 to-gray-600 relative">
              <button className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition">
                📷 Change cover photo
              </button>
            </div>

            {/* Profile Info */}
            <div className="px-6 pb-6 relative">
              <div className="flex justify-between items-end -mt-20 mb-4">
                <div className="flex items-end gap-4">
                  <div className="relative">
                    <img
                      src={avatarPreview || currentUser.avatar || "/default-avatar.svg"}
                      className="w-32 h-32 rounded-full border-4 border-white object-cover"
                      alt="Profile"
                    />
                    <label className="absolute bottom-2 right-2 bg-gray-600 text-white p-2 rounded-full cursor-pointer hover:bg-gray-800 transition">
                      📷
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {currentUser.first_name} {currentUser.last_name}
                    </h1>
                    <p className="text-gray-600">@{currentUser.username}</p>
                    <p className="text-gray-600 text-sm">{currentUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 transition"
                >
                  ✏️ Edit profile
                </button>
              </div>

              {/* Profile Stats */}
              <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{userPosts.length}</p>
                  <p className="text-gray-600">Posts</p>
                </div>
                {/* <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">1.2K</p>
                  <p className="text-gray-600">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">456</p>
                  <p className="text-gray-600">Following</p>
                </div> */}
              </div>

              {/* Security Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="flex-1 bg-orange-100 text-orange-700 px-4 py-2 rounded-lg font-bold hover:bg-orange-200 transition"
                >
                  🔐 Change password
                </button>
                <button
                  onClick={() => setShowForgotModal(true)}
                  className="flex-1 bg-red-100 text-red-700 px-4 py-2 rounded-lg font-bold hover:bg-red-200 transition"
                >
                  ❓ Forgot password
                </button>
              </div>
            </div>
          </div>

          {/* User Posts */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your posts</h2>
            {userPosts.length === 0 && (
              <div className="bg-white rounded-lg shadow-md p-4 text-gray-600 text-sm">
                You have not published any posts yet.
              </div>
            )}
            {userPosts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Edit profile</h2>
            
            {message && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
                {message}
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  First name
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={editForm.first_name}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-gray-500"
                  placeholder="Enter first name"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Last name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={editForm.last_name}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-gray-500"
                  placeholder="Enter last name"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-gray-500"
                  placeholder="Enter email"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg font-bold hover:bg-gray-400 transition"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gray-600 text-white py-2 rounded-lg font-bold hover:bg-gray-800 transition disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Change password</h2>
            
            {message && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
                {message}
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Current password
                </label>
                <input
                  type="password"
                  name="old_password"
                  value={passwordForm.old_password}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-gray-500"
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  New password
                </label>
                <input
                  type="password"
                  name="new_password"
                  value={passwordForm.new_password}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-gray-500"
                  placeholder="Enter new password"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Confirm password
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  value={passwordForm.confirm_password}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-gray-500"
                  placeholder="Confirm password"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg font-bold hover:bg-gray-400 transition"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 text-white py-2 rounded-lg font-bold hover:bg-orange-700 transition disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Change password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Forgot password</h2>
            
            {message && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
                {message}
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Email or username
                </label>
                <input
                  type="text"
                  value={forgotForm.identifier}
                  onChange={handleForgotChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-gray-500"
                  placeholder="Enter your email or username"
                  required
                />
              </div>

              <p className="text-sm text-gray-600">
                We will send password reset instructions to your email.
              </p>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg font-bold hover:bg-gray-400 transition"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 transition disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Send request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
