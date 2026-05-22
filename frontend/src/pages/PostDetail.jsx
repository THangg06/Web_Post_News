import { useState, useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Avatar from "../components/Avatar";
import { AuthContext } from "../context/AuthContext";
import { getPostDetail } from "../services/api";

function PostDetail() {
  const { id: postId } = useParams();
  const { isLoggedIn } = useContext(AuthContext);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  const handleAddComment = () => {
    if (newComment.trim()) {
      setComments([
        ...comments,
        {
          id: comments.length + 1,
          author: "You",
          avatar: "/default-avatar.svg",
          time: "Just now",
          content: newComment,
          likes: 0,
          replies: [],
        },
      ]);
      setNewComment("");
    }
  };

  // Fetch post detail
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const data = await getPostDetail(postId);
        setPost(data);
        const mappedComments = Array.isArray(data.comments)
          ? data.comments.map((item) => ({
              id: item.id,
              author: item.author?.username || "Anonymous",
              avatar: item.author?.avatar || "/default-avatar.svg",
              time: item.created_at ? new Date(item.created_at).toLocaleDateString("en-US") : "",
              content: item.content,
              likes: 0,
              replies: [],
            }))
          : [];
        setComments(mappedComments);
        setError(null);
      } catch (err) {
        console.error("Error fetching post:", err);
        setError("Unable to load the post");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar />

      <div className="flex gap-6 max-w-7xl mx-auto pt-4 px-4">
        {/* Main Content */}
        <div className="flex-1 max-w-7xl">
          {loading && (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <p>Loading post...</p>
            </div>
          )}

          {error && (
            <div className="bg-white rounded-lg shadow-md p-6 text-center text-red-600">
              <p>{error}</p>
            </div>
          )}

          {post && (
            <>
              {/* Post */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={post.author?.avatar || "/default-avatar.svg"}
                      alt="Author"
                      size="md"
                    />
                    <div>
                      <h3 className="font-bold text-gray-900">{post.author?.username || "Anonymous"}</h3>
                      <p className="text-gray-500 text-sm">
                        {post.created_at ? new Date(post.created_at).toLocaleDateString("en-US") : ""}
                      </p>
                    </div>
                  </div>
                  <button className="text-2xl hover:bg-gray-100 p-2 rounded-full transition">•••</button>
                </div>

                {/* Content */}
                <div className="mb-4">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h1>
                  <p className="text-gray-900 text-lg leading-relaxed">{post.content}</p>
                </div>

                {/* Image */}
                {post.image && (
                  <img
                    src={post.image}
                    className="w-full rounded-lg mb-4"
                    alt="Post content"
                  />
                )}

                {/* Stats */}
                <div className="flex justify-between text-gray-500 text-sm px-2 py-2 border-b mb-4">
                  <span>👁 {post.views || 0} views</span>
                  <span>👍 {post.likes_count || 0} • 💬 {post.comments_count || 0}</span>
                </div>

                {/* Actions */}
                <div className="flex justify-around py-2 mb-4 border-b">
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition">
                    👍 Like
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition">
                    💬 Comment
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition">
                    🔄 Share
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-bold text-lg mb-6">Comments ({comments.length})</h3>

                {/* Add Comment */}
                {isLoggedIn && (
                  <div className="flex gap-3 mb-6 pb-6 border-b">
                    <Avatar
                      src="/default-avatar.svg"
                      alt="Your profile"
                      size="md"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full bg-gray-100 rounded-full px-4 py-2 outline-none focus:bg-gray-200 transition"
                      />
                      {newComment.trim() && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => setNewComment("")}
                            className="px-4 py-1 hover:bg-gray-100 rounded font-bold text-gray-700"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddComment}
                            className="px-4 py-1 bg-blue-600 text-white rounded font-bold hover:bg-blue-700"
                          >
                            Comment
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!isLoggedIn && (
                  <div className="mb-6 pb-6 border-b text-center text-gray-500">
                    <p>Please log in to comment</p>
                  </div>
                )}

                {/* Comments List */}
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar
                        src={comment.avatar || "/default-avatar.svg"}
                        alt={comment.author}
                        size="md"
                      />
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-lg px-4 py-3">
                          <p className="font-bold text-gray-900">{comment.author}</p>
                          <p className="text-gray-700">{comment.content}</p>
                        </div>
                        <div className="text-xs text-gray-500 mt-2 space-x-3">
                          <span className="font-bold cursor-pointer hover:underline">Like</span>
                          <span className="cursor-pointer hover:underline">Reply</span>
                          <span>{comment.time}</span>
                        </div>
                        {comment.likes > 0 && (
                          <div className="text-xs text-gray-500 mt-1">👍 {comment.likes}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PostDetail;
