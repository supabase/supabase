export type ElicitationProviderHint = {
  name: string
  prefix?: string
  dashboardUrl?: string
}

export type ElicitationRequest = {
  tool: string
  ref: string
  project: string
  account: string
  keyName: string
  providerHint?: ElicitationProviderHint
  existingSecret?: { updatedAt: string | undefined }
}

export type ElicitationState =
  | { status: 'loading' }
  | { status: 'form'; request: ElicitationRequest }
  | { status: 'stored'; request: ElicitationRequest; timedOut: boolean }
  | { status: 'already-stored'; request: ElicitationRequest }
  | { status: 'expired' }
  | { status: 'cancelled' }
  | { status: 'paused' }
  | { status: 'error' }
  | { status: 'wrong-account'; signedInAs: string }

export type ElicitationStatus = ElicitationState['status']

export type ElicitationOutcomeState = Extract<
  ElicitationState,
  { status: 'stored' | 'already-stored' | 'expired' | 'cancelled' | 'paused' | 'error' }
>

export type ElicitationCopy = {
  title: string
  subtitle: string
  calloutTitle: string
  calloutBody: string
  footer: string
}
