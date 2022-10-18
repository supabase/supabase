import React, { useState } from 'react'
import { Auth, ThemeSupa } from '@supabase/auth-ui-react'
import JSONInput from 'react-json-editor-ajrm'
import locale from 'react-json-editor-ajrm/locale/en'
import { supabase } from './utils/supabaseClient'
import { functionsList } from './functionsList'

const sampleObject = { name: 'world' }

function App() {
  const { user } = Auth.useUser()
  const [supaFunction, setSupaFunction] = useState(functionsList[0])
  const [requestJson, setRequestJson] = useState(sampleObject)
  const [responseJson, setResponseJson] = useState({})

  const invokeFunction = async () => {
    setResponseJson({ loading: true })
    const { data, error } = await supabase.functions.invoke(supaFunction, {
      body: JSON.stringify(requestJson),
    })
    if (error) alert(error)
    setResponseJson(data)
  }

  return (
    <div className="p-2">
      <h2 className="mb-2 text-4xl">Supabase Egde Functions Test Client</h2>
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="p-2">
          <h3 className="mb-2 text-3xl">Request</h3>
          <h4 className="text-2xl">Function</h4>
          <select
            className="form-select m-0focus:border-green-600
              block
              w-full
              appearance-none
              rounded
              border
              border-solid
              border-gray-300
              bg-white bg-clip-padding bg-no-repeat
              px-3 py-1.5 text-base
              font-normal
              text-gray-700
              transition
              ease-in-out 
              focus:bg-white focus:text-gray-700 focus:outline-none"
            onChange={(e) => setSupaFunction(e.target.value)}
          >
            {functionsList.map((func) => (
              <option value={func} key={func}>
                {func}
              </option>
            ))}
          </select>
          <p className="mb-2">
            Note: when using locally, this selection doesn't have any effect and the function that's
            currently being served via the CLI is called instead.
          </p>
          <h4 className="mb-2 text-2xl">Body</h4>
          <JSONInput
            onChange={({ jsObject }) => setRequestJson(jsObject)}
            placeholder={sampleObject}
            locale={locale}
            height="100"
            width="100%"
          />
          <button
            className="mt-2 rounded bg-green-500 py-2 px-4 font-bold text-white hover:bg-green-700"
            onClick={invokeFunction}
          >
            Invoke Function
          </button>
        </div>
        <div className="p-2">
          <h3 className="mb-2 text-3xl">Response</h3>
          <pre className="bg-gray-300 p-2	">{JSON.stringify(responseJson, null, 2)}</pre>
        </div>
        <div className="p-2">
          <h3 className="mb-2 text-3xl">Log in to see RLS in action</h3>
          {user ? (
            <div>
              <h4 className="mb-2 text-2xl">{`Logged in as ${user.email}`}</h4>
              <button
                className="rounded bg-green-500 py-2 px-4 font-bold text-white hover:bg-green-700"
                onClick={() => supabase.auth.signOut()}
              >
                Sign out
              </button>
            </div>
          ) : (
            <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />
          )}
        </div>
      </div>
    </div>
  )
}

export default App
