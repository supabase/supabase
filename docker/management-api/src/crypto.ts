import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

import { env } from './env.js'

const ENC_PREFIX = 'enc:v1:'
const ENC_PREFIX_V2 = 'enc:v2:'
const IV_BYTES = 12
const TAG_BYTES = 16

function encryptionKey(): Buffer {
  return createHash('sha256').update(`management-enc:${env.encryptionKey}`).digest()
}

function decodeBase64(value: string, expectedBytes?: number): Buffer {
  const buffer = Buffer.from(value, 'base64')
  if (buffer.toString('base64').replace(/=+$/, '') !== value.replace(/=+$/, '')) {
    throw new Error('malformed encrypted value')
  }
  if (expectedBytes !== undefined && buffer.length !== expectedBytes) {
    throw new Error('malformed encrypted value')
  }
  return buffer
}

export function encryptString(plaintext: string, context = ''): string {
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv)
  cipher.setAAD(Buffer.from(context, 'utf8'))
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${ENC_PREFIX_V2}${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext.toString('base64')}`
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(ENC_PREFIX) || value.startsWith(ENC_PREFIX_V2)
}

export function decryptString(value: string, context = ''): string {
  const isV2 = value.startsWith(ENC_PREFIX_V2)
  if (!isV2 && !value.startsWith(ENC_PREFIX)) {
    throw new Error('value is not encrypted')
  }

  const parts = value.slice((isV2 ? ENC_PREFIX_V2 : ENC_PREFIX).length).split(':')
  if (parts.length !== 3) throw new Error('malformed encrypted value')
  const [ivB64, tagB64, ctB64] = parts

  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), decodeBase64(ivB64, IV_BYTES))
  decipher.setAuthTag(decodeBase64(tagB64, TAG_BYTES))
  if (isV2) decipher.setAAD(Buffer.from(context, 'utf8'))
  return Buffer.concat([
    decipher.update(decodeBase64(ctB64)),
    decipher.final(),
  ]).toString('utf8')
}

const SENSITIVE_KEY_RE =
  /(SECRET|SECRETS|PASSWORD|PASS|TOKEN|ACCESS_KEY|API_KEY|APIKEY|PRIVATE_KEY|CREDENTIALS|ACCOUNT_SID|CLIENT_ID)$/

export function isSensitiveConfigKey(key: string): boolean {
  return SENSITIVE_KEY_RE.test(key)
}
