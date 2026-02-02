import { KJUR } from 'jsrsasign'
import { useState } from 'react'
import { Button, CodeBlock } from 'ui'

const JWT_HEADER = { alg: 'HS256', typ: 'JWT' }

const generateRandomString = (length: number) => {
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''

  const MAX = Math.floor(256 / CHARS.length) * CHARS.length - 1
  const randomUInt8Array = new Uint8Array(1)

  for (let i = 0; i < length; i++) {
    let randomNumber: number
    do {
      crypto.getRandomValues(randomUInt8Array)
      randomNumber = randomUInt8Array[0]
    } while (randomNumber > MAX)

    result += CHARS[randomNumber % CHARS.length]
  }

  return result
}

const generateKeys = () => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const fiveYears = new Date(now.getFullYear() + 5, now.getMonth(), now.getDate())
  const iat = Math.floor(today.valueOf() / 1000)
  const exp = Math.floor(fiveYears.valueOf() / 1000)

  const anonToken = { role: 'anon', iss: 'supabase', iat, exp }
  const serviceToken = { role: 'service_role', iss: 'supabase', iat, exp }

  const secret = generateRandomString(40)
  const anonKey = KJUR.jws.JWS.sign(null, JWT_HEADER, anonToken, secret)
  const serviceRoleKey = KJUR.jws.JWS.sign(null, JWT_HEADER, serviceToken, secret)
  return { secret, anonKey, serviceRoleKey }
}

export default function JwtGeneratorSimple() {
  const [keys, setKeys] = useState(generateKeys)

  const regenerate = () => {
    setKeys(generateKeys())
  }

  return (
    <div className="border rounded-lg p-4">
      <div className="grid mb-8">
        <label htmlFor="secret">JWT_SECRET</label>
        <CodeBlock language="bash" className="relative font-mono">
          {keys.secret}
        </CodeBlock>
      </div>

      <div className="grid mb-8">
        <label htmlFor="anon">ANON_KEY</label>
        <CodeBlock language="bash" className="relative font-mono">
          {keys.anonKey}
        </CodeBlock>
      </div>

      <div className="grid mb-8">
        <label htmlFor="service">SERVICE_ROLE_KEY</label>
        <CodeBlock language="bash" className="relative font-mono">
          {keys.serviceRoleKey}
        </CodeBlock>
      </div>

      <Button type="primary" onClick={regenerate}>
        Generate new
      </Button>
    </div>
  )
}
