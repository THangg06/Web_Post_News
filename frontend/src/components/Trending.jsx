import { useContext } from "react";
import Avatar from "./Avatar";
import { AuthContext } from "../context/AuthContext";

function Trending() {
  const trends = [
    { topic: "Fake News Detection", posts: "12.5K posts" },
    { topic: "Machine Learning", posts: "8.3K posts" },
    { topic: "AI Technology", posts: "15.2K posts" },
    { topic: "Web Development", posts: "9.8K posts" },
    { topic: "Data Science", posts: "7.1K posts" },
  ];

  return (
    <div className="hidden lg:block w-80">
      {/* Trending */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4 sticky top-20">
        <h3 className="font-bold text-gray-900 mb-4 text-lg">🔥 Trending Now</h3>
        <div className="space-y-3">
          {trends.map((trend, index) => (
            <a
              key={index}
              href="#"
              className="block p-3 hover:bg-gray-50 rounded-lg transition border-b last:border-b-0"
            >
              <p className="font-bold text-gray-900 text-sm hover:text-blue-600">
                {trend.topic}
              </p>
              <p className="text-gray-500 text-xs">{trend.posts}</p>
            </a>
          ))}
        </div>
      </div>

      {/* Gợi ý
      <div className="bg-white rounded-lg shadow-md p-4 sticky top-80">
        <h3 className="font-bold text-gray-900 mb-4 text-lg">👥 Suggested for You</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src="/default-avatar.svg"
                  className="w-10 h-10 rounded-full"
                  alt="User"
                />
                <div>
                  <p className="font-bold text-sm text-gray-900">User {i}</p>
                  <p className="text-gray-500 text-xs">100 mutual friends</p>
                </div>
              </div>
              <button className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-700 transition">
                Add
              </button>
            </div>
          ))}
        </div>
      </div> */}
    </div>
  );
}

export default Trending;
