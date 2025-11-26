import { useState } from "react";

export default function SearchBar({ onSearch }) {
  const [q, setQ] = useState("");

  return (
    <input
      className="border px-3 py-2 rounded-md w-full mb-4"
      placeholder="Search todos..."
      value={q}
      onChange={(e) => {
        setQ(e.target.value);
        onSearch(e.target.value);
      }}
    />
  );
}
