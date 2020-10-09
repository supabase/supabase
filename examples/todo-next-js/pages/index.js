import { useState, useEffect } from 'react'
import { supabase } from '../lib/api'
import Auth from '../components/Auth'
import TodoList from '../components/TodoList'

export default function IndexPage() {
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const user = supabase.auth.currentUser
    setCurrentUser(user)
  }, [])

  const onLogout = async () => {
    try {
      await supabase.auth.logout()
      setCurrentUser(null)
    } catch (error) {
      console.log('error', error)
    }
  }
  return (
    <div className="w-full h-full bg-gray-300">
      {!currentUser ? (
        <div className="w-full h-full flex justify-center items-center p-4">
          <Auth onLogin={(user) => setCurrentUser(user)} />
        </div>
      ) : (
        <div
          className="w-full h-full flex flex-col justify-center items-center p-4"
          style={{ minWidth: 250, maxWidth: 600, margin: 'auto' }}
        >
          <TodoList user={currentUser} />
          <button className="btn-black w-full mt-12" onClick={onLogout}>
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
