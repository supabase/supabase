import React, { useState } from 'react'
import KJUR from 'jsrsasign'
import CodeBlock from './CodeBlock/CodeBlock'
import { Button } from 'ui'

const JWT_HEADER = { alg: 'HS256', typ: 'JWT' }
const now = new Date()
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
const fiveYears = new Date(now.getFullYear() + 5, now.getMonth(), now.getDate())
const anonToken = `
{
    "role": "anon",
    "iss": "supabase",
    "iat": ${Math.floor(today / 1000)},
    "exp": ${Math.floor(fiveYears / 1000)}
}
`.trim()

const serviceToken = `
{
    "role": "service_role",
    "iss": "supabase",
    "iat": ${Math.floor(today / 1000)},
    "exp": ${Math.floor(fiveYears / 1000)}
}
`.trim()

export default function JwtGenerator({}) {
  const secret = [...Array(40)].map(() => Math.random().toString(36)[2]).join('')

  const [jwtSecret, setJwtSecret] = useState(secret)
  const [token, setToken] = useState(anonToken)
  const [signedToken, setSignedToken] = useState('')

  const handleKeySelection = (e) => {
    const val = e.target.value
    if (val == 'service') setToken(serviceToken)
    else setToken(anonToken)
  }
  const generate = () => {
    const signedJWT = KJUR.jws.JWS.sign(null, JWT_HEADER, token, jwtSecret)
    setSignedToken(signedJWT)
  }

  return (
    <div>
      <div className="grid mb-8">
        <label for="secret">JWT Secret:</label>
        <input
          id="secret"
          className="border rounded bg-gray-200 w-full"
          type="text"
          placeholder="JWT Secret (at least 32 characters)"
          value={jwtSecret}
          onChange={(e) => setJwtSecret(e.target.value)}
        />
      </div>
      <div className="grid mb-8">
        <label for="service">Preconfigured Payload:</label>
        <select
          id="service"
          onChange={handleKeySelection}
          className="border rounded bg-gray-200 w-full"
        >
          <option value="anon">ANON_KEY</option>
          <option value="service">SERVICE_KEY</option>
        </select>
      </div>

      <div className="grid mb-8">
        <label for="token">Payload:</label>
        <textarea
          id="token"
          type="text"
          rows="5"
          placeholder="A valid JWT Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
      </div>

      <Button type="primary" onClick={generate}>
        Generate JWT
      </Button>

      {signedToken && (
        <div className="mt-8">
          <h4>Generated Token:</h4>
          <CodeBlock language="bash" className="relative">
            {signedToken}
          </CodeBlock>
        </div>
      )}
    </div>
  )
}
