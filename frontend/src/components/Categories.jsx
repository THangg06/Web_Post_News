import { useState, useEffect } from "react";
import { getCategories } from "../services/api";

function Categories({ activeCategory = "all", onCategoryChange = () => {} }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await getCategories();
        if (!mounted) return;
        const mapped = [{ id: "all", label: "📰 All", icon: "📰" }, ...data.map(c => ({ id: c.id, label: c.name }))];
        setCategories(mapped);
      } catch (e) {
        if (!mounted) return;
        setCategories([{ id: "all", label: "📰 All", icon: "📰" }]);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-3 mb-4 overflow-x-auto sticky top-20 z-40">
      <div className="flex gap-2 whitespace-nowrap">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              console.log("📁 Category clicked:", cat.id, cat.label);
              onCategoryChange(String(cat.id));
            }}
            className={`px-4 py-2 rounded-full font-medium text-sm transition whitespace-nowrap ${
              String(activeCategory) === String(cat.id)
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Categories;
