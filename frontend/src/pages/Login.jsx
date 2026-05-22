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
        console.log("Login successful:", response.user);
      } else {
        await syncUser();
      }
      navigate("/", { replace: true });
    } catch (loginError) {
      setError(loginError.message || "Unable to log in");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="flex gap-12 w-full max-w-5xl">
        {/* Left Side - Branding */}
        <div className="hidden md:flex flex-1 flex-col justify-center">
          <h1 className="text-5xl font-black text-gray-900 mb-4">ABC News</h1>
          <p className="text-2xl text-gray-700 mb-2">Discover the latest news</p>
          <p className="text-gray-900">Share the latest stories</p>
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
                placeholder="Email or username"
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
                placeholder="Password"
                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg outline-none focus:bg-white focus:border-2 focus:border-blue-500 transition"
                required
              />
            </div>

            {/* Remember Me */}
            {/* <div className="mb-6 flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
              <label htmlFor="rememberMe" className="ml-2 text-gray-700">
                Keep me signed in
              </label>
            </div> */}

            {/* Login Button */}
            <button
              type="submit"
              className="w-full bg-gray-900 text-white font-bold text-lg py-3 rounded-lg hover:bg-gray-500 transition mb-4 disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Log in"}
            </button>

            {/* Forgot Password Button */}
            <div className="text-center mb-4">
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-gray-900 hover:underline font-bold"
              >
                Forgot password?
              </button>
            </div>

            {/* Divider */}
            {/* <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="text-gray-500 font-bold">OR</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div> */}

            {/* Social Login */}
            {/* <div className="space-y-3 mb-6">
              <button type="button" className="w-full bg-blue-500 text-white font-bold py-2 rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2">
                👤 Log in with Facebook
              </button>
              <button type="button" className="w-full bg-red-500 text-white font-bold py-2 rounded-lg hover:bg-red-600 transition flex items-center justify-center gap-2">
                🔴 Log in with Google
              </button>
            </div> */}

            {/* Divider */}
            <div className="h-px bg-gray-300 my-6"></div>

            {/* Register Link */}
            <p className="text-center text-gray-700">
              Don't have an account?{" "}
              <Link to="/register" className="text-gray-900 font-bold hover:underline">
                Create a new account
              </Link>
            </p>
          </form>
        </div>
      </div>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                  placeholder="Enter your email or username"
                  required
                />
              </div>

              <p className="text-sm text-gray-900">
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

export default Login;
