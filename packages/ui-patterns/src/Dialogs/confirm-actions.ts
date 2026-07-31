export type ConfirmAction = 'delete' | 'purge' | 'disable' | 're-enable' | 'proceed' | 'custom'

export const CONFIRM_ACTION_STRINGS: Record<Exclude<ConfirmAction, 'custom'>, string> = {
  delete: 'DELETE',
  purge: 'PURGE',
  disable: 'DISABLE',
  're-enable': 'RE-ENABLE',
  proceed: 'PROCEED',
}

export const CONFIRM_ACTION_VERBS: Record<Exclude<ConfirmAction, 'custom'>, string> = {
  delete: 'delete',
  purge: 'purge',
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
