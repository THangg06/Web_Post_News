import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, forgotPassword } from "../services/api";
import { AuthContext } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login, syncUser } = useContext(AuthContext);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotForm, setForgotForm] = useState({ identifier: "" });

  const handleForgotChange = (e) => {
    setForgotForm({ identifier: e.target.value });
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await forgotPassword(forgotForm);
      setMessage("Hướng dẫn đặt lại mật khẩu đã được gửi! Vui lòng kiểm tra email.");
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotForm({ identifier: "" });
        setMessage("");
      }, 3000);
    } catch (err) {
      setError(err.message || "Không thể xử lý yêu cầu");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await loginUser({
        identifier,
        password,
      });

      if (response?.user) {
        login(response.user);
      } else {
        await syncUser();
      }
      navigate("/", { replace: true });
    } catch (loginError) {
      setError(loginError.message || "Không thể đăng nhập");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="flex gap-12 w-full max-w-5xl">
        {/* Left Side - Branding */}
        <div className="hidden md:flex flex-1 flex-col justify-center">
          <h1 className="text-5xl font-black text-blue-600 mb-4">PBL7</h1>
          <p className="text-2xl text-gray-700 mb-2">PBL7 giúp bạn kết nối với bạn bè, gia đình và những người khác.</p>
          <p className="text-gray-600">Chia sẻ những khoảnh khắc quan trọng, học tập và phát triển kỹ năng.</p>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 bg-white rounded-lg shadow-xl p-8">
          <form onSubmit={handleLogin}>
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Email Input */}
            <div className="mb-4">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Email hoặc tên đăng nhập"
                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg outline-none focus:bg-white focus:border-2 focus:border-blue-500 transition"
                required
              />
            </div>

            {/* Password Input */}
            <div className="mb-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu"
                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg outline-none focus:bg-white focus:border-2 focus:border-blue-500 transition"
                required
              />
            </div>

            {/* Remember Me */}
            <div className="mb-6 flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
              <label htmlFor="rememberMe" className="ml-2 text-gray-700">
                Giữ tôi ở trạng thái đăng nhập
              </label>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-bold text-lg py-3 rounded-lg hover:bg-blue-700 transition mb-4 disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>

            {/* Forgot Password Button */}
            <div className="text-center mb-4">
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-blue-600 hover:underline font-bold"
              >
                Quên mật khẩu?
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="text-gray-500 font-bold">HOẶC</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            {/* Social Login */}
            <div className="space-y-3 mb-6">
              <button type="button" className="w-full bg-blue-500 text-white font-bold py-2 rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2">
                👤 Đăng nhập bằng Facebook
              </button>
              <button type="button" className="w-full bg-red-500 text-white font-bold py-2 rounded-lg hover:bg-red-600 transition flex items-center justify-center gap-2">
                🔴 Đăng nhập bằng Google
              </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-300 my-6"></div>

            {/* Register Link */}
            <p className="text-center text-gray-700">
              Bạn chưa có tài khoản?{" "}
              <Link to="/register" className="text-blue-600 font-bold hover:underline">
                Tạo tài khoản mới
              </Link>
            </p>
          </form>
        </div>
      </div>
            {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Quên mật khẩu</h2>
            
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
                  Email hoặc tên đăng nhập
                </label>
                <input
                  type="text"
                  value={forgotForm.identifier}
                  onChange={handleForgotChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                  placeholder="Nhập email hoặc tên đăng nhập"
                  required
                />
              </div>

              <p className="text-sm text-gray-600">
                Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu đến email của bạn.
              </p>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg font-bold hover:bg-gray-400 transition"
                  disabled={loading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 transition disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? "Đang xử lý..." : "Gửi yêu cầu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
