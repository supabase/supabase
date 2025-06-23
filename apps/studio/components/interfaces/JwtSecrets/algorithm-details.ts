export interface AlgorithmDetail {
  name: string
  description: string
  pros: string[]
  cons: string[]
  label: string
  shortDescription: string
  links: { url: string; label: string }[]
}

export const algorithmDetails: Record<string, AlgorithmDetail> = {
  HS256: {
    label: 'HS256 (Symmetric)',
    name: 'HMAC with SHA-256',
    description: 'Symmetric algorithm using a shared secret key',
    pros: [
      'Fast and simple to use',
      'Requires less computational power',
      'Suitable for server-to-server communication',
    ],
    cons: [
      'Requires secure key exchange',
      "Not suitable when the verifier shouldn't be able to sign tokens",
      'Key needs to be kept secret on both sides',
    ],
    shortDescription: 'HMAC with SHA-256: Fast, simple, requires secure key exchange',
    links: [
      { url: 'https://jwt.io/introduction', label: 'JWT.io Introduction' },
      {
        url: 'https://datatracker.ietf.org/doc/html/rfc7518#section-3.2',
        label: 'RFC 7518 Specification',
      },
    ],
  },
  RS256: {
    label: 'RSA 2048',
    name: 'RSA with SHA-256',
    description: 'Asymmetric algorithm using a public/private key pair',
    pros: [
      'Allows public key to be distributed freely',
      'Private key can be kept secret on the signing side',
      "Suitable for scenarios where the verifier shouldn't be able to sign tokens",
    ],
    cons: [
      'Slower than HS256',
      'Requires more computational power',
      'Keys are larger than ECDSA keys',
    ],
    shortDescription: 'RSA with SHA-256: Allows public key distribution, slower',
    links: [
      { url: 'https://jwt.io/introduction', label: 'JWT.io Introduction' },
      {
        url: 'https://datatracker.ietf.org/doc/html/rfc7518#section-3.3',
        label: 'RFC 7518 Specification',
      },
    ],
  },
  ES256: {
    label: 'ECC (P-256)',
    name: 'ECDSA with SHA-256',
    description: 'Asymmetric algorithm using elliptic curve cryptography',
    pros: [
      'Faster than RSA',
      'Smaller key and signature sizes compared to RSA',
      'Provides forward secrecy',
    ],
    cons: [
      'Less widely supported than RSA',
      'More complex to implement correctly',
      'Requires careful implementation to avoid timing attacks',
    ],
    shortDescription: 'ECDSA with SHA-256: Compact keys, fast, modern alternative to RSA',
    links: [
      { url: 'https://jwt.io/introduction', label: 'JWT.io Introduction' },
      {
        url: 'https://datatracker.ietf.org/doc/html/rfc7518#section-3.4',
        label: 'RFC 7518 Specification',
      },
    ],
  },
}

export const algorithmLabels = Object.keys(algorithmDetails).reduce(
  (a, i) => {
    a[i] = algorithmDetails[i].label
    return a
  },
  {} as { [name: keyof typeof algorithmDetails]: string }
)

export const algorithmDescriptions = Object.keys(algorithmDetails).reduce(
  (a, i) => {
    a[i] = algorithmDetails[i].shortDescription
    return a
  },
  {} as { [name: keyof typeof algorithmDetails]: string }
)
