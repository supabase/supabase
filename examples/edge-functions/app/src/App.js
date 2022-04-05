import React, { useState } from 'react'
import { Auth, Button, Typography, Select } from '@supabase/ui'
import JSONInput from 'react-json-editor-ajrm'
import locale from 'react-json-editor-ajrm/locale/en'
import { supabase } from './utils/supabaseClient'
import { functionsList } from './functionsList'

const { Title, Text } = Typography
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
      <Title level={2} className="mb-2">
        Supabase Egde Functions Test Client
      </Title>
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="p-2">
          <Title level={3} className="mb-2">
            Request
          </Title>
          <Title level={4}>Function</Title>
          <Select onChange={(e) => setSupaFunction(e.target.value)}>
            {functionsList.map((func) => (
              <Select.Option value={func} key={func}>
                {func}
              </Select.Option>
            ))}
          </Select>
          <Text className="mb-2">
            Note: when using locally, this selection doesn't have any effect and the function that's
            currently being served via the CLI is called instead.
          </Text>
          <Title level={4} className="mb-2">
            Body
          </Title>
          <JSONInput
            onChange={({ jsObject }) => setRequestJson(jsObject)}
            placeholder={sampleObject}
            locale={locale}
            height="100"
            width="100%"
          />
          <Button className="mt-2" onClick={invokeFunction}>
            Invoke Function
          </Button>
        </div>
        <div className="p-2">
          <Title level={3} className="mb-2">
            Response
          </Title>
          <pre className="p-2 bg-gray-300	">{JSON.stringify(responseJson, null, 2)}</pre>
        </div>
        <div className="p-2">
          <Title level={3} className="mb-2">
            Log in to see RLS in action
          </Title>
          {user ? (
            <div>
              <Title level={4} className="mb-2">{`Logged in as ${user.email}`}</Title>
              <Button onClick={() => supabase.auth.signOut()}>Sign out</Button>
            </div>
          ) : (
            <Auth supabaseClient={supabase} />
          )}
        </div>
      </div>
    </div>
  )
}

export default App
