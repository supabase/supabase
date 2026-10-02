import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'
import { getConfig } from '../../config'

const { encryptionKey } = getConfig()

/**
 * Generate CryptoJs.AES key from passphrase
 * https://github.com/brix/crypto-js/issues/468
 * */
function convertPassphraseToAesKeyBuffer(key: string, salt: Buffer): Buffer {
  const password = Buffer.concat([Buffer.from(key, 'utf8'), salt])
  const hash: Buffer[] = []
  let digest = password
  for (let i = 0; i < 3; i++) {
    hash[i] = createHash('md5').update(digest).digest()
    digest = Buffer.concat([hash[i]!, password])
  }
  return Buffer.concat(hash)
}

/**
 * Replicate CryptoJs.AES.decrypt method
 * */
export function decrypt(ciphertext: string): string {
  const cipherBuffer = Buffer.from(ciphertext, 'base64')
  const salt = cipherBuffer.subarray(8, 16)
  const keyDerivation = convertPassphraseToAesKeyBuffer(encryptionKey, salt)
  const [key, iv] = [keyDerivation.subarray(0, 32), keyDerivation.subarray(32)]
  const contents = cipherBuffer.subarray(16)
  const decipher = createDecipheriv('aes-256-cbc', key, iv)
  const decrypted = Buffer.concat([decipher.update(contents), decipher.final()])
  return decrypted.toString('utf8')
}

/**
 * Replicate CryptoJs.AES.encrypt method
 * */
export function encrypt(plaintext: string): string {
  const salt = randomBytes(8)
  const keyDerivation = convertPassphraseToAesKeyBuffer(encryptionKey, salt)
  const [key, iv] = [keyDerivation.subarray(0, 32), keyDerivation.subarray(32)]
  const cipher = createCipheriv('aes-256-cbc', key, iv)
  const contents = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const encrypted = Buffer.concat([Buffer.from('Salted__', 'utf8'), salt, contents])
  return encrypted.toString('base64')
}
