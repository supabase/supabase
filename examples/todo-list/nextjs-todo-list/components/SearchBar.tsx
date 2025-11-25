import { useState } from "react";
import { motion } from "framer-motion";

export default function SearchBar({ onSearch }) {
  const [q, setQ] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full mb-6"
    >
      <div className="relative">
        <input
          className="w-full border border-gray-300 px-4 py-2 rounded-xl pl-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          placeholder="Search todos..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            onSearch(e.target.value);
          }}
        />
        <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
      </div>
    </motion.div>
  );
}
