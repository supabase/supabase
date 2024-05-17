import { useState } from 'react'
import { Admonition, Button, Input } from 'ui'

function base64URL(value: string) {
  return globalThis.btoa(value).replace(/[=]/g, '').replace(/[+]/g, '-').replace(/[\/]/g, '_')
}

/*
Convert a string into an ArrayBuffer
from https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
*/
function stringToArrayBuffer(value: string) {
  const buf = new ArrayBuffer(value.length)
  const bufView = new Uint8Array(buf)
  for (let i = 0; i < value.length; i++) {
    bufView[i] = value.charCodeAt(i)
  }
  return buf
}

function arrayBufferToString(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf))
}

const generateAppleSecretKey = async (
  kid: string,
  iss: string,
  sub: string,
  file: File
): Promise<{ kid: string; jwt: string; exp: number }> => {
  if (!kid) {
    const match = file.name.match(/AuthKey_([^.]+)[.].*$/i)
    if (match && match[1]) {
      kid = match[1]
    }
  }

  if (!kid) {
    throw new Error(
      `No Key ID provided. The file "${file.name}" does not follow the AuthKey_XXXXXXXXXX.p8 pattern. Please provide a Key ID manually.`
    )
  }

  const contents = await file.text()

  if (!contents.match(/^\s*-+BEGIN PRIVATE KEY-+[^-]+-+END PRIVATE KEY-+\s*$/i)) {
    throw new Error(`Chosen file does not appear to be a PEM encoded PKCS8 private key file.`)
  }

  // remove PEM headers and spaces
  const pkcs8 = stringToArrayBuffer(
    globalThis.atob(contents.replace(/-+[^-]+-+/g, '').replace(/\s+/g, ''))
  )

  const privateKey = await globalThis.crypto.subtle.importKey(
    'pkcs8',
    pkcs8,
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign']
  )

  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + 180 * 24 * 60 * 60

  const jwt = [
    base64URL(JSON.stringify({ typ: 'JWT', kid, alg: 'ES256' })),
    base64URL(
      JSON.stringify({
        iss,
        sub,
        iat,
        exp,
        aud: 'https://appleid.apple.com',
      })
    ),
  ]

  const signature = await globalThis.crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: 'SHA-256',
    },
    privateKey,
    stringToArrayBuffer(jwt.join('.'))
  )

  jwt.push(base64URL(arrayBufferToString(signature)))

  return { kid, jwt: jwt.join('.'), exp }
}

const AppleSecretGenerator = () => {
  const [file, setFile] = useState({ file: null as File | null })
  const [teamID, setTeamID] = useState('')
  const [serviceID, setServiceID] = useState('')
  const [keyID, setKeyID] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [error, setError] = useState('')

  return (
    <>
      <Input
        label="Account ID"
        labelOptional="required"
        placeholder="Apple Developer account ID, 10 alphanumeric digits"
        descriptionText="Found in the upper-right corner of Apple Developer Center."
        value={teamID}
        onChange={(e) => setTeamID(e.target.value.trim())}
      />
      <Input
        label="Service ID"
        labelOptional="required"
        placeholder="ID of the service, example: com.example.app.service"
        descriptionText="Found under Certificates, Identifiers & Profiles in Apple Developer Center."
        value={serviceID}
        onChange={(e) => setServiceID(e.target.value.trim())}
      />
      <Input
        label="Key ID"
        labelOptional="(optional)"
        placeholder="Extracted from filename, AuthKey_XXXXXXXXXX.p8"
        descriptionText="If the file you select does not preserve the original name from Apple Developer Center, please enter the key ID."
        value={keyID}
        onChange={(e) => setKeyID(e.target.value.trim())}
      />
      <div>
        <input
          type="file"
          onChange={(e) => {
            setFile({ file: e.target.files[0] })
          }}
        />
      </div>
      <div style={{ height: '1rem' }} />

      <Button
        size="medium"
        disabled={
          !(
            teamID.length === 10 &&
            serviceID &&
            ((globalThis && globalThis.showOpenFilePicker) || file.file)
          )
        }
        onClick={async () => {
          setError('')

          try {
            const { kid, jwt, exp } = await generateAppleSecretKey(
              keyID,
              teamID,
              serviceID,
              file.file
            )
            setKeyID(kid)
            setSecretKey(jwt)
            setExpiresAt(new Date(exp * 1000).toString())
            setError('')
          } catch (e: any) {
            setError(e.message)
            console.error(e)
          }
        }}
      >
        Generate Secret Key
      </Button>

      {error && <Admonition type="danger">{error}</Admonition>}

      {secretKey && (
        <>
          <div style={{ height: '1rem' }} />
          <Input
            label="Secret Key"
            value={secretKey}
            descriptionText={`Valid until: ${expiresAt}. Make sure you generate a new one before then!`}
            reveal
            copy
            size="medium"
          />
        </>
      )}
    </>
  )
}

export default AppleSecretGenerator
