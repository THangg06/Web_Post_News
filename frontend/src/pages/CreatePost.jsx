import { useState, useEffect, useContext } from "react";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";
// Sidebar removed

function CreatePost() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    category: "tech",
    tags: "",
    image: "",
    priority: "normal",
  });

  const [categories, setCategories] = useState([]);
  useEffect(() => {
    let mounted = true;
    import("../services/api").then(({ getCategories }) => {
      getCategories().then(data => {
        if (!mounted) return;
        setCategories(data.map(c => ({ id: c.id, label: c.name })));
      }).catch(() => {
        if (!mounted) return;
        setCategories([]);
      })
    });
    return () => { mounted = false; };
  }, []);

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

  const handlePublish = () => {
    if (formData.title.trim() && formData.content.trim()) {
      console.log("Publish news:", formData);
      alert("Tin tức đã được đăng!");
      setFormData({
        title: "",
        description: "",
        content: "",
        category: "tech",
        tags: "",
        image: "",
        priority: "normal",
      });
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />

      <div className="flex gap-6 max-w-7xl mx-auto pt-4 px-4">
        {/* Sidebar removed */}

        {/* Main Content */}
        <div className="flex-1 max-w-4xl">
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* Header */}
            <div className="mb-6 pb-6 border-b">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">📰 Đăng tin tức mới</h1>
              <p className="text-gray-600">Chia sẻ tin tức, bài viết chuyên sâu với độc giả</p>
            </div>

            {/* Title */}
            <div className="mb-6">
              <label className="block text-gray-700 font-bold mb-2">📌 Tiêu đề (Headline) *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Nhập tiêu đề tin tức hấp dẫn..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition text-lg font-bold"
                maxLength="100"
                required
              />
              <p className="text-gray-500 text-sm mt-1">{formData.title.length}/100 ký tự</p>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-gray-700 font-bold mb-2">📝 Tóm tắt (Summary) *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Viết tóm tắt ngắn gọn về tin tức (sẽ hiển thị trong danh sách tin)..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition resize-none h-20"
                maxLength="200"
              />
              <p className="text-gray-500 text-sm mt-1">{formData.description.length}/200 ký tự</p>
            </div>

            {/* Category & Priority */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-gray-700 font-bold mb-2">🏷️ Chuyên mục *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition font-medium"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2">⭐ Độ ưu tiên</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition font-medium"
                >
                  <option value="normal">📌 Bình thường</option>
                  <option value="important">⚡ Quan trọng</option>
                  <option value="breaking">🔴 Tin nóng</option>
                </select>
              </div>
            </div>

            {/* Image Upload */}
            <div className="mb-6">
              <label className="block text-gray-700 font-bold mb-2">📸 Hình ảnh bìa</label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="flex items-center justify-center gap-2 px-4 py-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition">
                    <span className="text-2xl">📷</span>
                    <div>
                      <p className="font-bold text-gray-700">Tải ảnh lên</p>
                      <p className="text-gray-500 text-sm">hoặc kéo thả file</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {formData.image && (
                  <div className="flex-1">
                    <img
                      src={formData.image}
                      className="w-full h-40 object-cover rounded-lg border border-gray-300"
                      alt="Preview"
                    />
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, image: "" }))}
                      className="mt-2 text-red-600 font-bold text-sm hover:text-red-700"
                    >
                      ✕ Xóa ảnh
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Content Editor */}
            <div className="mb-6">
              <label className="block text-gray-700 font-bold mb-2">📄 Nội dung bài viết *</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Viết nội dung chi tiết của tin tức tại đây...

Bạn có thể sử dụng:
- Paragraph để chia nhỏ nội dung
- Dấu * cho danh sách
- Dấu # cho tiêu đề phụ"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition font-mono resize-none h-64"
              />
              <p className="text-gray-500 text-sm mt-1">{formData.content.length} ký tự</p>
            </div>

            {/* Tags */}
            <div className="mb-6">
              <label className="block text-gray-700 font-bold mb-2">🏷️ Tags (cách nhau bằng dấu phẩy)</label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="AI, Machine Learning, Công nghệ, Python"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.tags.split(",").map((tag, index) => (
                  tag.trim() && (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold"
                    >
                      {tag.trim()}
                    </span>
                  )
                ))}
              </div>
            </div>

            {/* Preview */}
            {(formData.title || formData.description) && (
              <div className="mb-6 pb-6 border-t pt-6 bg-blue-50 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3">👁 Xem trước</h3>
                <div className="bg-white rounded-lg overflow-hidden shadow">
                  {formData.image && (
                    <img
                      src={formData.image}
                      className="w-full h-48 object-cover"
                      alt="Preview"
                    />
                  )}
                  <div className="p-4">
                    <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold mb-2">
                      {categories.find(c => c.id === formData.category)?.label.split(" ")[1]}
                    </span>
                    <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                      {formData.title || "Tiêu đề tin tức"}
                    </h2>
                    <p className="text-gray-700 text-sm line-clamp-2">
                      {formData.description || "Tóm tắt nội dung..."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-6 border-t">
              <button className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-100 transition">
                💾 Lưu nháp
              </button>
              <button
                onClick={handlePublish}
                disabled={!formData.title.trim() || !formData.content.trim()}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                🚀 Đăng tin tức
              </button>
              <button className="px-4 py-3 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-100 transition">
                ⋯ Thêm tùy chọn
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreatePost;