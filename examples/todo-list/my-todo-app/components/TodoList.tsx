import { useState } from "react";
import TodoItem from "./TodoItem";
import SearchBar from "./SearchBar";

export default function TodoList({ todos }) {
  const [search, setSearch] = useState("");

  const filteredTodos = todos.filter(todo =>
    todo.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <SearchBar onSearch={setSearch} />

      {filteredTodos.length === 0 && (
        <p className="text-gray-500">No matching todos</p>
      )}

      {filteredTodos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </div>
  );
}
