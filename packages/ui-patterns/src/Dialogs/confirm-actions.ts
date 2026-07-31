export type ConfirmAction =
  | 'delete'
  | 'purge'
  | 'revoke'
  | 'disable'
  | 're-enable'
  | 'proceed'
  | 'custom'

export const CONFIRM_ACTION_STRINGS: Record<Exclude<ConfirmAction, 'custom'>, string> = {
  delete: 'DELETE',
  purge: 'PURGE',
  revoke: 'REVOKE',
  disable: 'DISABLE',
  're-enable': 'RE-ENABLE',
  proceed: 'PROCEED',
}

export const CONFIRM_ACTION_VERBS: Record<Exclude<ConfirmAction, 'custom'>, string> = {
  delete: 'delete',
  purge: 'purge',
  revoke: 'revoke',
  disable: 'disable',
  're-enable': 're-enable',
  proceed: 'proceed with',
}

export function getConfirmStringFromAction(
  confirmAction: ConfirmAction | undefined,
  confirmString?: string
): string {
  if (confirmAction && confirmAction !== 'custom') {
    return CONFIRM_ACTION_STRINGS[confirmAction]
  }

  return confirmString ?? ''
}

export function getConfirmPlaceholderFromAction(
  confirmAction: ConfirmAction | undefined,
  confirmPlaceholder?: string
): string {
  if (confirmAction && confirmAction !== 'custom') {
    return CONFIRM_ACTION_STRINGS[confirmAction]
  }

  return confirmPlaceholder ?? ''
}

export function getConfirmLabelText(
  confirmString: string,
  confirmAction: ConfirmAction | undefined,
  confirmSubject?: string
): string {
  if (confirmAction && confirmAction !== 'custom' && confirmSubject) {
    const verb = CONFIRM_ACTION_VERBS[confirmAction]
    return `Type ${confirmString} to ${verb} ${confirmSubject}.`
  }

  return `Type ${confirmString} to confirm.`
}
