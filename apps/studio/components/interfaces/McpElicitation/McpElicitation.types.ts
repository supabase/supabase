export type ElicitationProviderHint = {
  name: string
  prefix?: string
  dashboardUrl?: string
}

export type ElicitationRequest = {
  tool: string
  /** `null` when the calling client did not identify itself. */
  client: string | null
  requestedAt: string
  project: string
  account: string
  keyName: string
  providerHint?: ElicitationProviderHint
}

export type ElicitationState =
  | { status: 'loading' }
  | { status: 'form'; request: ElicitationRequest }
  | { status: 'stored'; request: ElicitationRequest; timedOut: boolean }
  | { status: 'already-stored'; request: ElicitationRequest }
  | { status: 'expired' }
  | { status: 'cancelled' }
  | { status: 'paused' }
  /** `signedInAs` is the current browser session, never the account that created the request. */
  | { status: 'wrong-account'; signedInAs: string }

export type ElicitationStatus = ElicitationState['status']

/** The terminal states that render as title + subtitle + "Next step" callout + footer. */
export type ElicitationOutcomeState = Extract<
  ElicitationState,
  { status: 'stored' | 'already-stored' | 'expired' | 'cancelled' | 'paused' }
>

export type ElicitationCopy = {
  title: string
  subtitle: string
  calloutTitle: string
  calloutBody: string
  footer: string
}
