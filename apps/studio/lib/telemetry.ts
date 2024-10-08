import { Sha256 } from '@aws-crypto/sha256-browser'

export interface TelemetryProps {
  screenResolution?: string
  language: string
}

/**
 * Generates a unique identifier for an anonymous user based on their gotrue id.
 */
export const getAnonId = async (id: string) => {
  const hash = new Sha256()
  hash.update(id)
  const u8Array = await hash.digest()
  const binString = Array.from(u8Array, (byte) => String.fromCodePoint(byte)).join('')
  const b64encoded = btoa(binString)
  return b64encoded
}
