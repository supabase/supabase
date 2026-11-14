const randomByte = () => crypto.getRandomValues(new Uint8Array(1))[0]

/** Uniform random integer in [0, max) for max <= 256, using rejection sampling to avoid modulo bias. */
const randomIndex = (max: number) => {
  const limit = 256 - (256 % max)
  let value = randomByte()
  while (value >= limit) value = randomByte()
  return value % max
}

export const generateRandomString = (length: number, charset: string) =>
  Array.from({ length }, () => charset[randomIndex(charset.length)]).join('')

export const generateRandomBase64 = (byteLength: number) =>
  btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(byteLength))))
