import { useEffect, useState } from "react";
import { getFeaturedPosts } from "../services/api";
import { useNavigate } from "react-router-dom";

function FeaturedStories() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    let mounted = true;
    const loadFeatured = async () => {
      try {
        const posts = await getFeaturedPosts(3);
        if (!mounted) {
          return;
        }
        const mappedPosts = posts.map((post) => ({
          id: post.id,
          title: post.title,
          image: post.image,
          category: post.category?.name || "Chuyên mục",
          views: post.views ?? 0,
          author: post.author?.username || "Ẩn danh",
        }));
        setFeatured(mappedPosts);
      } catch {
        if (!mounted) {
          return;
        }
        setFeatured([]);
      }
    };

    loadFeatured();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-white font-bold text-2xl mb-6">⭐ Bài viết mới nhất</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {featured.length === 0 && (
          <div className="md:col-span-3 bg-white/90 rounded-lg p-4 text-sm text-gray-600 text-center">
            Chưa có dữ liệu bài viết nổi bật.
          </div>
        )}

        {featured.map((story) => (
          <a
            key={story.id}
            href="#"
            className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition transform hover:-translate-y-1"
          >
            {story.image && (
              <img
                src={story.image}
                className="w-full h-40 object-cover"
                alt={story.title}
              />
            )}
            <div className="p-4">
              <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold mb-2">
                {story.category}
              </span>
              <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-2">
                <button onClick={() => navigate(`/post/${story.id}`)}>
                  {story.title}
                </button>
              </h3>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{story.author}</span>
                <span>👁 {story.views}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export default FeaturedStories;
