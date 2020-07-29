import { useState, useContext } from 'react'
import UserContext from 'lib/UserContext'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/router'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

const Home = () => {
  const { signIn } = useContext(UserContext)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleLogin = async (type, username, password) => {
    try {
      const { body } =
        type == 'LOGIN'
          ? await supabase.auth.login(username, password)
          : await supabase.auth.signup(username, password)

      const user = await supabase.auth.user()
      if (!!user) signIn(user.id, user.email)
    } catch (error) {
      console.log('error', error)
      alert(error.error_description || error)
    }
  }

  return (
    <div className="container mx-auto h-full flex justify-center items-center">
      <div className="w-1/3 mt-8">
        <div className="border-teal p-8 border-t-12 bg-white mb-6 rounded-lg shadow-lg">
          <div className="mb-4">
            <label className="font-bold text-grey-darker block mb-2">Email</label>
            <input
              type="text"
              className="block appearance-none w-full bg-white border border-grey-light hover:border-grey px-2 py-2 rounded shadow"
              placeholder="Your Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="font-bold text-grey-darker block mb-2">Password</label>
            <input
              type="password"
              className="block appearance-none w-full bg-white border border-grey-light hover:border-grey px-2 py-2 rounded shadow"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <a
              onClick={(e) => {
                e.preventDefault()
                handleLogin('LOGIN', username, password)
              }}
              href={'/channels'}
              className="bg-gray-900 hover:bg-teal text-white font-bold py-2 px-4 rounded"
            >
              Login
            </a>
            <a
              onClick={(e) => {
                e.preventDefault()
                handleLogin('SIGNUP', username, password)
              }}
              href={'/channels'}
              className="bg-gray-900 hover:bg-teal text-white font-bold py-2 px-4 rounded"
            >
              Sign up
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
