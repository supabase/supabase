import React, { useState } from 'react'
import { Button, Typography, Select } from '@supabase/ui'
import JSONInput from 'react-json-editor-ajrm'
import locale from 'react-json-editor-ajrm/locale/en'
import { createClient } from '@supabase/supabase-js'
import { functionsList } from './functionsList'

const { Title, Text, Link } = Typography
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL ?? 'http://localhost:54321',
  process.env.REACT_APP_SUPABASE_ANON_KEY ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24ifQ.625_WdcF3KHqz5amU0x2X5WWHP-OEs_4qj0ssLNHzTs'
)
const sampleObject = { name: 'world' }

function App() {
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
    <div className="">
      <Title level={2}>Supabase Egde Functions Test Client</Title>
      <div>
        <Title level={3}>Request</Title>
        <Title level={4}>Function</Title>
        <Select onChange={(e) => setSupaFunction(e.target.value)}>
          {functionsList.map((func) => (
            <Select.Option value={func} key={func}>
              {func}
            </Select.Option>
          ))}
        </Select>
        <Text>
          Note: when using locally, this selection doesn't have any effect and the function that's
          currently being served via the CLI is called instead.
        </Text>
        <Title level={4}>Body</Title>
        <JSONInput
          onChange={({ jsObject }) => setRequestJson(jsObject)}
          placeholder={sampleObject}
          locale={locale}
          height="100"
        />
        <Title level={4}>Send request:</Title>
        <Button onClick={invokeFunction}>Submit</Button>
      </div>
      <div>
        <Title level={3}>Response</Title>
        <pre>{JSON.stringify(responseJson, null, 2)}</pre>
      </div>
    </div>
  )
}

export default App
