import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "./Avatar";

function PostCard({ post = {} }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(124);
  const [showComments, setShowComments] = useState(false);

  const authorName = typeof post.author === "string"
    ? post.author
    : post.author?.username || "Anonymous";
  const authorAvatar = post.avatar || post.author?.avatar || "/default-avatar.svg";
  const categoryName = typeof post.category === "string"
    ? post.category
    : post.category?.name || "Technology";
  const commentCount = Array.isArray(post.comments)
    ? post.comments.length
    : post.comments_count || post.comments || 0;
  const timeLabel = post.time || (post.created_at
    ? new Date(post.created_at).toLocaleDateString("en-US")
    : "2 hours ago");

  const handleLike = () => {
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
  };

  const postData = {
    ...post,
    author: authorName,
    avatar: authorAvatar,
    time: timeLabel,
    title: post.title || "Phát hiện tin giả với AI",
    content: post.content || "This is a post about fake news detection! 🚀 AI technology keeps getting smarter.",
    category: categoryName,
    image: post.image || null,
    views: post.views ?? "2.5K",
    comments_count: commentCount,
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden mb-4">
      {/* Image */}
      {postData.image && (
        <img
          src={postData.image}
          className="w-full h-56 object-cover cursor-pointer hover:opacity-90 transition"
          alt="Post content"
        />
      )}

      {/* Content */}
      <div className="p-4">
        {/* Category Badge */}
        <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold mb-3">
          {postData.category}
        </span>

        {/* Title */}
        <h2 
          className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 cursor-pointer"
          onClick={() => navigate(`/post/${postData.id}`)}
        >
          {postData.title}
        </h2>

        <div className="flex items-center justify-between mb-3 pb-3 border-b">
          <div className="flex items-center gap-3">
            <Avatar
              src={postData.avatar}
              alt={postData.author}
              size="md"
              className="cursor-pointer hover:opacity-80"
              fallback={true}
            />
            <div>
              <p className="font-bold text-gray-900 text-sm hover:underline cursor-pointer">
                {postData.author}
              </p>
              <p className="text-gray-500 text-xs">{postData.time}</p>
            </div>
          </div>
          <button className="text-2xl hover:bg-gray-100 p-2 rounded-full transition">
            •••
          </button>
        </div>

        {/* Content Summary */}
        <div className="mb-3">
          <p className="text-gray-700 leading-relaxed line-clamp-2">{postData.content}</p>
        </div>

      {/* Stats */}
      <div className="flex justify-between text-gray-500 text-sm px-0 py-2 border-b">
        <span>👁 {postData.views} views</span>
        <span>👍 {postData.likes_count || 0} • 💬 {postData.comments_count || 0}</span>
      </div>

        {/* Actions */}
        <div className="flex justify-around py-2 border-t">
          <button
            onClick={handleLike}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition ${
              liked
                ? "text-blue-600 hover:bg-blue-50"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {liked ? "👍" : "🤍"} Like
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition"
          >
            💬 Comment
        </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition">
            🔄 Share
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition">
            ➡️ More
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-3 pt-3 border-t space-y-3">
            <div className="text-sm text-gray-600 mb-3">Comments</div>
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-2">
                <img
                  src="/default-avatar.svg"
                  className="w-8 h-8 rounded-full"
                  alt="Commenter"
                />
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-lg px-3 py-2">
                    <p className="font-bold text-sm text-gray-900">User {i}</p>
                    <p className="text-gray-700 text-sm">Great post! 👍</p>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 space-x-3">
                    <span className="cursor-pointer hover:underline">Like</span>
                    <span className="cursor-pointer hover:underline">Reply</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <img
                src="/default-avatar.svg"
                className="w-8 h-8 rounded-full"
                alt="Your profile"
              />
              <input
                type="text"
                placeholder="Write a comment..."
                className="flex-1 bg-gray-100 rounded-full px-3 py-2 outline-none focus:bg-gray-200 transition"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PostCard;