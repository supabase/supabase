export type SecretProviderHint = {
  name: string
  prefix?: string
  dashboardUrl?: string
}

export type SecretRequest = {
  tool: string
  ref: string
  project: string
  account: string
  keyName: string
  providerHint?: SecretProviderHint
  existingSecret?: { updatedAt: string | undefined }
}

export type SecretsState =
  | { status: 'loading' }
  | { status: 'form'; request: SecretRequest }
  | { status: 'stored'; request: SecretRequest; timedOut: boolean }
  | { status: 'already-stored'; request: SecretRequest }
  | { status: 'expired' }
  | { status: 'cancelled' }
  | { status: 'paused' }
  | { status: 'error' }
  | { status: 'wrong-account'; signedInAs: string }

export type SecretsOutcomeState = Extract<
  SecretsState,
  { status: 'stored' | 'already-stored' | 'expired' | 'cancelled' | 'paused' | 'error' }
>
