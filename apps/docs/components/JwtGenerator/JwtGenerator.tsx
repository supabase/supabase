import { KJUR } from 'jsrsasign'
import { useState, ChangeEvent } from 'react'
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

const generateRandomString = (length: number) => {
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''

  /**
   * The number of possible Uint8 integers is 256. Since the length of `CHARS`
   * doesn't fit exactly into 256, simply taking the modulus would create an
   * uneven distribution that favors the earlier characters. To make a truly
   * uniform distribution, we have to discard everything above the last full
   * cycle, and pick again.
   *
   * The minus 1 is to account for 0-indexing.
   */
  const MAX = Math.floor(256 / CHARS.length) * CHARS.length - 1

  const randomUInt8Array = new Uint8Array(1)

  for (let i = 0; i < length; i++) {
    let randomNumber: number
    do {
      crypto.getRandomValues(randomUInt8Array)
      randomNumber = randomUInt8Array[0]
      /**
       * Keep picking until we get a number in the valid range.
       */
    } while (randomNumber > MAX)

    result += CHARS[randomNumber % CHARS.length]
  }

  return result
}

export default function JwtGenerator({}) {
  const secret = generateRandomString(40)

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
    <div className="border rounded-lg p-4">
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
        <label htmlFor="service">Key:</label>
        <Select id="service" style={{ fontFamily: 'monospace' }} onChange={handleKeySelection}>
          <Select.Option value="anon">ANON_KEY</Select.Option>
          <Select.Option value="service">SERVICE_KEY</Select.Option>
        </Select>
      </div>

      <div className="grid mb-8">
        <label htmlFor="token">The JWT will be generated from this info:</label>
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
