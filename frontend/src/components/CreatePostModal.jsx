import { useState, useEffect } from "react";
import { createPost, getCategories, getCurrentUserFromServer } from "../services/api";
import { getCurrentUser } from "../services/auth";

function CreatePostModal({ onPostCreate = () => {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
   const [currentUser, setCurrentUserState] = useState(null);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    image: "",
    feeling: "",
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await getCategories();
        if (!mounted) return;
        setCategories(data.map(c => ({ id: c.id, label: c.name })));
        if (!formData.category && data.length) {
          setFormData(prev => ({ ...prev, category: data[0].id }));
        }
      } catch (e) {
        if (!mounted) return;
        setCategories([]);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);
    useEffect(() => {
      const local = getCurrentUser();
      if (local) {
        setCurrentUserState(local);
        return;
      }

      const loadUser = async () => {
        try {
          const serverUser = await getCurrentUserFromServer();
          if (serverUser) {
            setCurrentUserState(serverUser);
          }
        } catch (e) {
          console.error("Failed to load user:", e);
        }
      };
      loadUser();
    }, []);

  const feelings = [
    { value: "happy", label: "😊 Happy" },
    { value: "love", label: "😍 Loved" },
    { value: "sad", label: "😢 Sad" },
    { value: "angry", label: "😠 Angry" },
    { value: "surprised", label: "😱 Surprised" },
    { value: "excited", label: "😆 Excited" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, image: event.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      // Find the category name from the categories list
      const selectedCategory = categories.find(c => c.id === parseInt(formData.category));
      
      if (!selectedCategory) {
        setError("Please select a valid category");
        setIsSaving(false);
        return;
      }
      
      const categoryName = selectedCategory.label;

      const createdPost = await createPost({
        title: formData.title.trim(),
        content: formData.content.trim(),
        category_name: categoryName,
        image: formData.image,
        feeling: formData.feeling,
        // include client-side user info for UI convenience (server should verify identity)
        client_user: currentUser
          ? {
              id: currentUser.id,
              username: currentUser.username,
              email: currentUser.email,
              first_name: currentUser.first_name,
              last_name: currentUser.last_name,
              avatar: currentUser.avatar,
            }
          : null,
      });

      // Prefer a real logged-in user from localStorage over a server-side "anonymous" user
      const serverAuthorName = createdPost.author?.username;
      const serverAuthorAvatar = createdPost.author?.avatar;
      const isServerAnonymous = !serverAuthorName || serverAuthorName.toLowerCase() === 'anonymous';
      const isServerAvatarDefault = !serverAuthorAvatar || serverAuthorAvatar === '/default-avatar.svg';

      const displayAuthor = isServerAnonymous ? (currentUser?.username || "You") : serverAuthorName;
      const displayAvatar = (!isServerAnonymous && !isServerAvatarDefault) ? serverAuthorAvatar : (currentUser?.avatar || "/default-avatar.svg");

      onPostCreate({
        id: createdPost.id,
        title: createdPost.title,
        content: createdPost.content,
        category: createdPost.category?.name || formData.category,
        image: createdPost.image || formData.image,
        feeling: createdPost.feeling,
        author: displayAuthor,
        avatar: displayAvatar,
        time: createdPost.created_at ? new Date(createdPost.created_at).toLocaleString("en-US") : "Just now",
        views: createdPost.views ?? 0,
      });

      setFormData({
        title: "",
        content: "",
        category: "Tech",
        image: "",
        feeling: "",
      });
      console.log("post:", createdPost);
      setIsOpen(false);
    } catch (createError) {
      setError(createError.message || "Unable to publish the post");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Create Post Card */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <img
            src={currentUser?.avatar || "/default-avatar.svg"}
            className="w-10 h-10 rounded-full object-cover"
            alt={currentUser?.username || "You"}
          />
          <button
            onClick={() => setIsOpen(true)}
            className="flex-1 bg-gray-100 text-gray-600 px-4 py-2 rounded-full hover:bg-gray-200 transition cursor-pointer text-left font-medium"
          >
            📰 Write a news post or share something?
          </button>
        </div>
        {/* <div className="flex justify-around border-t pt-3">
          <button 
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-lg transition font-medium"
          >
            📸 Photo
          </button>
          <button 
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-lg transition font-medium"
          >
            😊 Feeling
          </button>
          <button 
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-lg transition font-medium"
          >
            📍 Location
          </button>
        </div> */}
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">📰 Create a New Post</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-2xl hover:bg-gray-100 p-1 rounded-full transition"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* User Info */}
              <div className="flex items-center gap-3 pb-4 border-b">
                <img
                  src={currentUser?.avatar || "/default-avatar.svg"}
                  className="w-10 h-10 rounded-full object-cover"
                  alt={currentUser?.username || "You"}
                />
                <div>
                  <p className="font-bold text-gray-900">{currentUser?.username || "You"}</p>
                  <select className="text-sm bg-gray-100 rounded px-2 py-1">
                    <option>👥 Public</option>
                    <option>👤 Only me</option>
                    <option>👫 Friends</option>
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-gray-700 font-bold mb-2">📌 Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter an attention-grabbing title..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition font-bold text-lg"
                  maxLength="100"
                />
                <p className="text-gray-500 text-xs mt-1">{formData.title.length}/100 characters</p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-gray-700 font-bold mb-2">🏷️ Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition font-medium"
                >
                  {categories.length ? (
                    categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))
                  ) : (
                    <option value="">No category available</option>
                  )}
                </select>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-gray-700 font-bold mb-2">📸 Image</label>
                {!formData.image ? (
                  <label className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition">
                    <span className="text-2xl">📷</span>
                    <div className="text-left">
                      <p className="font-bold text-gray-700">Upload image</p>
                      <p className="text-gray-500 text-sm">or drag and drop a file</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <img
                      src={formData.image}
                      className="w-full h-40 object-cover rounded-lg border border-gray-300"
                      alt="Preview"
                    />
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, image: "" }))}
                      className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Content Input */}
              <div>
                <label className="block text-gray-700 font-bold mb-2">📝 Content</label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="Write the detailed content here..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition resize-none h-32"
                />
                <p className="text-gray-500 text-xs mt-1">{formData.content.length} characters</p>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2">😊 Feeling</label>
                <select
                  name="feeling"
                  value={formData.feeling}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition font-medium"
                >
                  <option value="">No feeling</option>
                  {feelings.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              {/* <div className="flex gap-2 pt-2 border-t">
                <button className="flex-1 flex items-center justify-center gap-2 p-2 hover:bg-gray-100 rounded transition text-gray-700 font-medium text-sm">
                  📸 Photo
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 p-2 hover:bg-gray-100 rounded transition text-gray-700 font-medium text-sm">
                  🎞️ Video
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 p-2 hover:bg-gray-100 rounded transition text-gray-700 font-medium text-sm">
                  😊 Feeling
                </button>
              </div> */}
            </div>

            {/* Footer */}
            {error && (
              <div className="px-4 pb-2 text-sm text-red-600 font-medium">
                {error}
              </div>
            )}
            <div className="sticky bottom-0 bg-white border-t p-4 flex gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handlePost}
                disabled={!formData.title.trim() || !formData.content.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Publishing..." : "🚀 Publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CreatePostModal;
