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
    label: 'HS256 (Shared Secret)',
    name: 'HMAC with SHA-256',
    description: 'JWT signatures are produced by a shared secret.',
    pros: ['Simple to use', 'Verifying and creating JWTs is very fast and not resource intensive'],
    cons: [
      'Usually not compatible with SOC2 and other security compliance frameworks',
      'Requires secure key exchange',
      "Not suitable when the verifier shouldn't be able to sign tokens",
      'Key needs to be kept secret on both sides',
    ],
    shortDescription: 'HMAC with SHA-256: Fast, simple, requires secure key exchange',
    links: [
      {
        url: 'https://datatracker.ietf.org/doc/html/rfc7518#section-3.2',
        label: 'RFC 7518 Specification Section 3.2',
      },
    ],
  },
  RS256: {
    label: 'RSA 2048',
    name: 'RSA with SHA-256',
    description: 'JWT is signed with a private and verified with a public RSA key.',
    pros: [
      'Compatible with SOC2 and other security compliance frameworks',
      'RSA is widely adopted and easier to work with',
      'Public key does not need to be kept secret',
    ],
    cons: [
      'Larger JWT sizes than other choices',
      'Slower to create and verify JWT than other choices',
    ],
    shortDescription: 'RSA with SHA-256: Widely adopted, has public key, slower',
    links: [
      {
        url: 'https://datatracker.ietf.org/doc/html/rfc7518#section-3.3',
        label: 'RFC 7518 Specification Section 3.3',
      },
    ],
  },
  ES256: {
    label: 'ECC (P-256)',
    name: 'ECDSA with SHA-256',
    description:
      'JWT is signed with a private and verified with a public ECC key using the NIST P-256 curve.',
    pros: [
      'Compatible with SOC2 and other security compliance frameworks',
      'Faster to create and verify signatures than RSA',
      'Ideal tradeoff between JWT size and efficiency',
      'Public key does not need to be kept secret',
    ],
    cons: ['Wide support but some libraries might make it harder to work with than RSA'],
    shortDescription: 'ECDSA with SHA-256: Faster, more efficient alternative to RSA',
    links: [
      {
        url: 'https://datatracker.ietf.org/doc/html/rfc7518#section-3.4',
        label: 'RFC 7518 Specification Section 3.4',
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
