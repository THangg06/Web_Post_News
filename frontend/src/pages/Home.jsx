import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import CreatePostModal from "../components/CreatePostModal";
import PostCard from "../components/PostCard";
// Sidebar removed
import Categories from "../components/Categories";
import FeaturedStories from "../components/FeaturedStories";
import Trending from "../components/Trending";
import { getPosts } from "../services/api";

const fallbackPosts = [
  {
    clientKey: "fallback-1",
    id: 1,
    title: "Fake News Detection with AI - A Major Breakthrough",
    author: "Nguyen Van A",
    avatar: "/default-avatar.svg",
    category: "Technology",
    time: "2 hours ago",
    content: "Just finished a fake news detection project with AI 🚀 This technology is truly impressive! It uses modern machine learning algorithms.",
    image: "https://picsum.photos/600/400?random=1",
    views: "2.5K",
  },
  {
    clientKey: "fallback-2",
    id: 2,
    title: "Machine Learning Is the Future of Technology",
    author: "Tran Thi B",
    avatar: "/default-avatar.svg",
    category: "Technology",
    time: "4 hours ago",
    content: "Machine learning is the future! 💡 Let's keep learning and growing our skills. Real-world applications keep appearing everywhere.",
    image: "https://picsum.photos/600/400?random=2",
    views: "3.1K",
  },
  {
    clientKey: "fallback-3",
    id: 3,
    title: "Technology Trends in 2024",
    author: "Le Van C",
    avatar: "/default-avatar.svg",
    category: "Technology",
    time: "6 hours ago",
    content: "The tech industry is seeing many changes this year. Web3, AI, and cloud computing continue to grow rapidly.",
    image: "https://picsum.photos/600/400?random=3",
    views: "1.8K",
  },
];

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState(fallbackPosts);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const queryParams = new URLSearchParams(location.search);
  const searchKeyword = (queryParams.get("q") || "").trim();
  const activeCategory = (queryParams.get("category") || "all").trim();

  console.log("🏠 Home rendering with location.search:", location.search, "searchKeyword:", searchKeyword, "activeCategory:", activeCategory);

  const handleCategoryChange = (categoryId) => {
    console.log("📁 handleCategoryChange called with:", categoryId);
    const nextParams = new URLSearchParams(location.search);
    if (!categoryId || categoryId === "all") {
      nextParams.delete("category");
    } else {
      nextParams.set("category", String(categoryId));
    }
    const nextQuery = nextParams.toString();
    console.log("📁 Navigating to:", nextQuery ? `/?${nextQuery}` : "/");
    navigate(nextQuery ? `/?${nextQuery}` : "/");
  };

  const buildClientKey = (post, index) => {
    if (post.clientKey) {
      return post.clientKey;
    }

    if (post.id !== undefined && post.id !== null) {
      return `post-${post.id}-${index}`;
    }

    return `post-${index}-${Date.now()}`;
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError("");
    console.log("🔍 Home useEffect triggered with searchKeyword:", searchKeyword, "activeCategory:", activeCategory);

    const loadPosts = async () => {
      try {
        console.log("📤 Calling getPosts with params:", { search: searchKeyword, category_id: activeCategory !== "all" ? activeCategory : undefined });
        const apiPosts = await getPosts({
          search: searchKeyword,
          category_id: activeCategory !== "all" ? activeCategory : undefined,
        });
        console.log("📥 getPosts response:", apiPosts);
        if (!isMounted) {
          return;
        }

        const mappedPosts = apiPosts.map((post) => ({
          clientKey: `api-${post.id}`,
          id: post.id,
          title: post.title,
          author: post.author?.username || "Anonymous",
          avatar: "/default-avatar.svg",
          category: post.category?.name || "Category",
          time: post.created_at ? new Date(post.created_at).toLocaleString("en-US") : "Just now",
          content: post.content,
          image: post.image || "",
          views: post.views ?? 0,
        }));
        console.log("✅ Mapped posts:", mappedPosts);

        const hasFilter = searchKeyword || activeCategory !== "all";
        setPosts(mappedPosts.length ? mappedPosts : hasFilter ? [] : fallbackPosts);
      } catch (fetchError) {
        if (isMounted) {
          console.error("❌ Error loading posts:", fetchError);
          setError(fetchError.message || "Unable to load data from the API");
          const hasFilter = searchKeyword || activeCategory !== "all";
          setPosts(hasFilter ? [] : fallbackPosts);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPosts();

    return () => {
      isMounted = false;
    };
  }, [searchKeyword, activeCategory, location.search]);

  const handlePostCreate = (newPost) => {
    setPosts((currentPosts) => [newPost, ...currentPosts]);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />

      <div className="flex gap-6 max-w-7xl mx-auto pt-4 px-4">
        {/* Left Sidebar removed */}

        {/* Main Feed */}
        <div className="flex-1 max-w-7xl">
          {/* Create Post */}
          <CreatePostModal onPostCreate={handlePostCreate} />

          {error && (
            <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
              The API did not respond correctly, showing sample data: {error}
            </div>
          )}

          {/* Categories */}
          <Categories activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />

          {/* Featured Stories */}
          <FeaturedStories />

          {/* Posts */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="rounded-lg bg-white p-6 text-center text-gray-500 shadow-md">
                Loading posts from the backend...
              </div>
            ) : searchKeyword && posts.length === 0 ? (
              <div className="rounded-lg bg-white p-6 text-center text-gray-500 shadow-md">
                No posts found for keyword "{searchKeyword}".
              </div>
            ) : (
                posts.map((post, index) => (
                  <PostCard key={buildClientKey(post, index)} post={post} />
                ))
            )}
          </div>
        </div>

        {/* Right Sidebar - Trending */}
        {/* <Trending /> */}
      </div>
    </div>
  );
}

export default Home;