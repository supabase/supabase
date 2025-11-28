import { createDecipheriv, createHash } from 'node:crypto'
import { SECRET } from './config.js'

/**
 * Generate CryptoJs.AES key from passphrase
 * https://github.com/brix/crypto-js/issues/468
 * */
function convertPassphraseToAesKeyBuffer(key: string, salt: Buffer): Buffer {
  const password = Buffer.concat([Buffer.from(key, 'binary'), salt])
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
export async function decryptString(ciphertext: string): Promise<string> {
  try {
    const cipherBuffer = Buffer.from(ciphertext, 'base64')
    const salt = cipherBuffer.subarray(8, 16)
    const keyDerivation = convertPassphraseToAesKeyBuffer((await SECRET()).MW_ENCRYPTION_KEY, salt)
    const [key, iv] = [keyDerivation.subarray(0, 32), keyDerivation.subarray(32)]
    const contents = cipherBuffer.subarray(16)
    const decipher = createDecipheriv('aes-256-cbc', key, iv)
    const decrypted = Buffer.concat([decipher.update(contents), decipher.final()])
    return decrypted.toString('utf8')
  } catch (e) {
    throw new Error(`Failed to decrypt data: ${e}`)
  }
}
