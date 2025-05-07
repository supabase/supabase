import { JWTAlgorithm, SigningKey } from 'state/jwt-secrets'

export const statusLabels: Record<SigningKey['status'], string> = {
  in_use: 'Current key',
  standby: 'Standby key',
  previously_used: 'Previous key',
  revoked: 'Revoked',
}

export const statusColors: Record<SigningKey['status'], string> = {
  standby: 'bg-surface-300 bg-opacity-100 text-foreground border border-foreground-muted',
  in_use: 'bg-brand-200 bg-opacity-100 text-brand-600 border-brand-500',
  previously_used: 'bg-purple-300 dark:bg-purple-100 text-purple-1200 border-purple-800',
  revoked: 'bg-destructive-200 bg-opacity-100 text-destructive-600 border-destructive-500',
}

export const algorithmLabels: Record<SigningKey['algorithm'], string> = {
  HS256: 'HS256 (Symmetric)',
  RS256: 'RS256 (RSA)',
  ES256: 'ES256 (ECC)',
  EdDSA: 'EdDSA (Ed25519)',
}

export const algorithmDescriptions: Record<JWTAlgorithm, string> = {
  HS256: 'HMAC with SHA-256: Fast, simple, requires secure key exchange',
  RS256: 'RSA with SHA-256: Allows public key distribution, slower',
  ES256: 'ECDSA with SHA-256: Compact keys, fast, modern alternative to RSA',
  EdDSA: 'EdDSA with Ed25519: Modern, fast, secure digital signature algorithm',
}
