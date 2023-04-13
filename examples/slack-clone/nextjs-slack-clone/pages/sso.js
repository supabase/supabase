import { useState } from 'react'
import { supabase } from 'lib/Store'

const SSOPage = () => {
  const [domain, setDomain] = useState('')

  const handleLogin = async (domain) => {
    try {
      const { error, data } = await supabase.auth.signInWithSSO({
        domain,
        options: {
          redirectTo: 'http://localhost:3002/channels',
        },
      })

      if (error) {
        alert('Error with auth: ' + error.message)
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.log('error', error)
      alert(error.error_description || error)
    }
  }

  return (
    <div className="w-full h-full flex justify-center items-center p-4 bg-gray-300">
      <div className="w-full sm:w-1/2 xl:w-1/3">
        <div className="border-teal p-8 border-t-12 bg-white mb-6 rounded-lg shadow-lg bg-white">
          <div className="mb-4">
            <label className="font-bold text-grey-darker block mb-2">Single Sign-on</label>
            <input
              type="text"
              className="block appearance-none w-full bg-white border border-grey-light hover:border-grey px-2 py-2 rounded shadow"
              placeholder="Enter your organization's domain name"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <a
              onClick={(e) => {
                e.preventDefault()
                handleLogin(domain)
              }}
              href={'/channels'}
              className="border border-indigo-700 text-indigo-700 py-2 px-4 rounded w-full text-center transition duration-150 hover:bg-indigo-700 hover:text-white"
            >
              Continue
            </a>
            <a
              href={'/'}
              className="border border-indigo-700 text-indigo-700 py-2 px-4 rounded w-full text-center transition duration-150 hover:bg-indigo-700 hover:text-white"
            >
              Back to login
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SSOPage
