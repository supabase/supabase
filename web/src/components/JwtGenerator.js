import React, { useState } from 'react'
import KJUR from 'jsrsasign'
import CustomCodeBlock from './CustomCodeBlock'

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
  const [jwtSecret, setJwtSecret] = useState(
    'your-super-secret-jwt-secret-with-at-least-32-characters-long'
  )
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
      <div style={styles.inputContainer}>
        <label>JWT Secret:</label>
        <input
          type="text"
          style={styles.input}
          placeholder="JWT Secret (at least 32 characters)"
          value={jwtSecret}
          onChange={(e) => setJwtSecret(e.target.value)}
        />
      </div>
      <div style={styles.inputContainer}>
        <label>Preconfigured Payload:</label>
        <select onChange={handleKeySelection} style={styles.input}>
          <option value="anon">ANON_KEY</option>
          <option value="service">SERVICE_KEY</option>
        </select>
      </div>
      <div style={styles.inputContainer}>
        <label>Payload:</label>
        <textarea
          type="text"
          style={styles.input}
          rows="5"
          placeholder="A valid JWT Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
      </div>
      <button className="button button--primary" onClick={generate}>
        Generate JWT
      </button>
      {signedToken && (
        <div style={{ marginTop: 20 }}>
          <h4>Generated Token</h4>
          <CustomCodeBlock code={signedToken} />
        </div>
      )}
    </div>
  )
}

const styles = {
  inputContainer: {
    marginBottom: '15px',
  },
  input: {
    border: '1px solid var(--ifm-panel-border-color)',
    borderRadius: 4,
    backgroundColor: 'var(--custom-background-color-diff)',
    color: 'var(--ifm-font-color-base)',
    margin: 0,
    padding: '6px 8px',
    width: '100%',
  },
  card: {
    border: '1px solid var(--ifm-panel-border-color)',
    borderRadius: 5,
    padding: 8,
  },
  title: {
    margin: 0,
    fontSize: '0.9rem',
    border: '1px solid var(--ifm-panel-border-color)',
  },
  description: {
    fontSize: '0.8rem',
    margin: 0,
  },
}
