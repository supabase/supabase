export type ElicitationProviderHint = {
  name: string
  prefix?: string
  dashboardUrl?: string
}

export type ElicitationRequest = {
  tool: string
  /** Resolved project name, not the ref — the ref means nothing to the reader. */
  project: string
  /** Email of the current browser session, rendered as "Signed in as". */
  account: string
  keyName: string
  providerHint?: ElicitationProviderHint
  /**
   * Present only when a secret already uses this name. `updatedAt` is
   * `undefined` when the platform returned the secret without a timestamp.
   */
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
  /** Project lookup or the write failed. Never carries the reason to the screen. */
  | { status: 'error' }
  /** `signedInAs` is the current browser session, never the account that created the request. */
  | { status: 'wrong-account'; signedInAs: string }

export type ElicitationStatus = ElicitationState['status']

/** The terminal states that render as title + subtitle + "Next step" callout + footer. */
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
