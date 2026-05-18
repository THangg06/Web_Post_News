import { useState } from "react";

function Avatar({ src, alt = "Avatar", size = "md", className = "", fallback = true }) {
  const [hasError, setHasError] = useState(false);

  // Default sizes
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xl: "w-20 h-20",
  };

  // Placeholder SVG (default avatar)
  const placeholderAvatar = (
    <svg
      className={`${sizeClasses[size]} ${className}`}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
    </svg>
  );

  // If no src or src failed to load, show placeholder
  if (hasError || !src || !fallback) {
    return (
      <div
        className={`${sizeClasses[size]} ${className} rounded-full bg-gray-300 flex items-center justify-center text-gray-600`}
      >
        {placeholderAvatar}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${sizeClasses[size]} ${className} rounded-full object-cover`}
      onError={() => setHasError(true)}
    />
  );
}

export default Avatar;
