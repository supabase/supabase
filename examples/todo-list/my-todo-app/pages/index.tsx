import Head from 'next/head'
import TodoList from '@/components/TodoList'

export default function Home() {

  // dummy sample todos so page works without Supabase
  const todos = [
    { id: 1, title: "Learn Supabase" },
    { id: 2, title: "Add Search Feature" },
    { id: 3, title: "Submit PR" }
  ];

  return (
    <>
      <Head>
        <title>Todo App</title>
      </Head>

      <div className="w-full min-h-screen flex justify-center items-start pt-28 bg-gradient-to-br from-gray-100 to-gray-200">
  <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-xl">
    <TodoList todos={todos} />
  </div>
</div>


    </>
  );
}
