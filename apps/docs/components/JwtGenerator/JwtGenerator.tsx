import { KJUR } from 'jsrsasign'
import { ChangeEvent, useState } from 'react'
import { Button, CodeBlock, Input, Select } from 'ui'

const JWT_HEADER = { alg: 'HS256', typ: 'JWT' }
const now = new Date()
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
const fiveYears = new Date(now.getFullYear() + 5, now.getMonth(), now.getDate())
const anonToken = `
{
  "role": "anon",
  "iss": "supabase",
  "iat": ${Math.floor(today.valueOf() / 1000)},
  "exp": ${Math.floor(fiveYears.valueOf() / 1000)}
}
`.trim()

const serviceToken = `
{
  "role": "service_role",
  "iss": "supabase",
  "iat": ${Math.floor(today.valueOf() / 1000)},
  "exp": ${Math.floor(fiveYears.valueOf() / 1000)}
}
`.trim()

export default function JwtGenerator({}) {
  const secret = [...Array(40)].map(() => Math.random().toString(36)[2]).join('')

  const [jwtSecret, setJwtSecret] = useState(secret)
  const [token, setToken] = useState(anonToken)
  const [signedToken, setSignedToken] = useState('')

  const handleKeySelection = (e: ChangeEvent<HTMLSelectElement>) => {
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
        <label htmlFor="secret">JWT Secret:</label>
        <Input
          id="secret"
          type="text"
          placeholder="JWT Secret (at least 32 characters)"
          value={jwtSecret}
          style={{ fontFamily: 'monospace' }}
          onChange={(e) => setJwtSecret(e.target.value)}
        />
      </div>
      <div className="grid mb-8">
        <label htmlFor="service">Preconfigured Payload:</label>
        <Select id="service" style={{ fontFamily: 'monospace' }} onChange={handleKeySelection}>
          <Select.Option value="anon">ANON_KEY</Select.Option>
          <Select.Option value="service">SERVICE_KEY</Select.Option>
        </Select>
      </div>

      <div className="grid mb-8">
        <label htmlFor="token">Payload:</label>
        <Input.TextArea
          id="token"
          type="text"
          rows={6}
          placeholder="A valid JWT Token"
          value={token}
          style={{ fontFamily: 'monospace' }}
          onChange={(e) => setToken(e.target.value)}
        />
      </div>

      <Button type="primary" onClick={generate}>
        Generate JWT
      </Button>

      {signedToken && (
        <div className="mt-8">
          <h4>Generated Token:</h4>
          <CodeBlock language="bash" className="relative font-mono">
            {signedToken}
          </CodeBlock>
        </div>
      )}
    </div>
  )
}
