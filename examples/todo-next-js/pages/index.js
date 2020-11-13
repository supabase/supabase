import { useState, useEffect } from 'react'
import { supabase } from '../lib/api'
import Auth from '../components/Auth'
import TodoList from '../components/TodoList'

export default function IndexPage() {
  let [session, setSession] = useState(null)

  useEffect(() => {
    setSession(supabase.auth.session())
    supabase.auth.onAuthStateChange((_event, session) => setSession(session))
  }, [])

  return (
    <div className="w-full h-full bg-gray-300">
      {!session ? (
        <div className="w-full h-full flex justify-center items-center p-4">
          <Auth />
        </div>
      ) : (
        <div
          className="w-full h-full flex flex-col justify-center items-center p-4"
          style={{ minWidth: 250, maxWidth: 600, margin: 'auto' }}
        >
          <TodoList user={supabase.auth.user()} />
          <button
            className="btn-black w-full mt-12"
            onClick={async () => {
              const { error } = await supabase.auth.signOut()
              if (error) console.log('Error logging out:', error.message)
            }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
