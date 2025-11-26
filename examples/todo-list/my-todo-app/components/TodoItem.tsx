export default function TodoItem({ todo }) {
  return (
    <div className="border px-4 py-2 rounded-md mb-2 bg-white shadow-sm">
      <p>{todo.title}</p>
    </div>
  );
}
