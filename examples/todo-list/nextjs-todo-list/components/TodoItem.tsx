import { motion } from "framer-motion";

export default function TodoItem({ todo }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={{ scale: 1.03 }}
      className="w-full bg-white shadow-sm border border-gray-200 rounded-xl py-3 px-4 my-2 text-center font-medium cursor-pointer hover:shadow-lg transition"
    >
      {todo.title}
    </motion.div>
  );
}
