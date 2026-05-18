import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/api";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      setIsSubmitting(false);
      return;
    }

    try {
      await registerUser({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        confirm_password: formData.confirmPassword,
        gender: formData.gender,
        date_of_birth: formData.dateOfBirth,
      });

      setSuccess("Đăng ký thành công. Chuyển sang trang đăng nhập...");
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch (registerError) {
      setError(registerError.message || "Không thể đăng ký");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-blue-100 flex items-center justify-center p-4 py-8">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-black text-blue-600 mb-2">PBL7</h1>
          <p className="text-gray-600">Tạo tài khoản mới để bắt đầu</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Tên"
              className="px-4 py-2 bg-gray-100 border-0 rounded-lg outline-none focus:bg-white focus:border-2 focus:border-blue-500 transition"
              required
            />
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Họ"
              className="px-4 py-2 bg-gray-100 border-0 rounded-lg outline-none focus:bg-white focus:border-2 focus:border-blue-500 transition"
              required
            />
          </div>

          {/* Email */}
          <div className="mb-4">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              className="w-full px-4 py-2 bg-gray-100 border-0 rounded-lg outline-none focus:bg-white focus:border-2 focus:border-blue-500 transition"
              required
            />
          </div>

          {/* Phone */}
          <div className="mb-4">
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Số điện thoại"
              className="w-full px-4 py-2 bg-gray-100 border-0 rounded-lg outline-none focus:bg-white focus:border-2 focus:border-blue-500 transition"
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Mật khẩu"
              className="w-full px-4 py-2 bg-gray-100 border-0 rounded-lg outline-none focus:bg-white focus:border-2 focus:border-blue-500 transition"
              required
            />
          </div>

          {/* Confirm Password */}
          <div className="mb-4">
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Xác nhận mật khẩu"
              className="w-full px-4 py-2 bg-gray-100 border-0 rounded-lg outline-none focus:bg-white focus:border-2 focus:border-blue-500 transition"
              required
            />
          </div>

          {/* Date of Birth */}
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Ngày sinh</label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-100 border-0 rounded-lg outline-none focus:bg-white focus:border-2 focus:border-blue-500 transition"
              required
            />
          </div>

          {/* Gender */}
          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">Giới tính</label>
            <div className="flex gap-4">
              {["Nam", "Nữ", "Khác"].map((g) => (
                <label key={g} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={formData.gender === g}
                    onChange={handleChange}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="ml-2 text-gray-700">{g}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Register Button */}
          <button
            type="submit"
            className="w-full bg-green-600 text-white font-bold text-lg py-3 rounded-lg hover:bg-green-700 transition mb-4 disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang tạo..." : "Tạo tài khoản"}
          </button>

          {/* Login Link */}
          <p className="text-center text-gray-700">
            Bạn đã có tài khoản?{" "}
            <Link to="/login" className="text-blue-600 font-bold hover:underline">
              Đăng nhập
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;
