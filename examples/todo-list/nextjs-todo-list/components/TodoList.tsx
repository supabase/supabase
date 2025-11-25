import { useState } from "react";
import { motion } from "framer-motion";
import TodoItem from "./TodoItem";
import SearchBar from "./SearchBar";

export default function TodoList({ todos }) {
  const [search, setSearch] = useState("");

  const filtered = todos.filter((todo) =>
    todo.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full">
      <SearchBar onSearch={setSearch} />

      {filtered.length === 0 ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-500 text-center mt-4"
        >
          ✨ No matching todos found ✨
        </motion.p>
      ) : (
        filtered.map((todo) => <TodoItem key={todo.id} todo={todo} />)
      )}
    </div>
  );
}
