export interface IPv4DisabledReasonOptions {
  isAws: boolean
  isProjectActive: boolean
  projectUpdateDisabled: boolean
  canUpdateIPv4: boolean
  ipv4Enabled: boolean
}

export const getIPv4DisabledReason = ({
  isAws,
  isProjectActive,
  projectUpdateDisabled,
  canUpdateIPv4,
  ipv4Enabled,
}: IPv4DisabledReasonOptions) => {
  if (!isAws) {
    return 'Dedicated IPv4 address is only available for AWS projects'
  }

  if (!isProjectActive) {
    return 'Project must be active to update IPv4'
  }

  if (projectUpdateDisabled) {
    return 'Project updates are currently disabled'
  }

  if (!canUpdateIPv4 && !ipv4Enabled) {
    return 'You can only add IPv4 when your project network configuration is set to IPv6'
  }

  return undefined
}

export interface PitrDisabledReasonOptions {
  isProjectActive: boolean
  projectUpdateDisabled: boolean
  hasHipaaAddon: boolean
  sufficientPgVersion: boolean
  isOrioleDbInAws: boolean
}

export const getPitrDisabledReason = ({
  isProjectActive,
  projectUpdateDisabled,
  hasHipaaAddon,
  sufficientPgVersion,
  isOrioleDbInAws,
}: PitrDisabledReasonOptions) => {
  if (!isProjectActive) {
    return 'Project must be active to update PITR'
  }

  if (projectUpdateDisabled) {
    return 'Project updates are currently disabled'
  }

  if (hasHipaaAddon) {
    return 'PITR cannot be changed with HIPAA enabled'
  }

  if (!sufficientPgVersion) {
    return 'Your project is too old to enable PITR'
  }

  if (isOrioleDbInAws) {
    return 'Point in time recovery is not supported with OrioleDB'
  }

  return undefined
}

export interface CustomDomainDisabledReasonOptions {
  isProjectActive: boolean
  projectUpdateDisabled: boolean
}

export const getCustomDomainDisabledReason = ({
  isProjectActive,
  projectUpdateDisabled,
}: CustomDomainDisabledReasonOptions) => {
  if (!isProjectActive) {
    return 'Project must be active to update custom domain'
  }

  if (projectUpdateDisabled) {
    return 'Project updates are currently disabled'
  }

  return undefined
}

export type PitrAlertState = 'hipaa' | 'legacy-project' | 'orioledb' | undefined

export const getPitrAlertState = ({
  hasHipaaAddon,
  sufficientPgVersion,
  isOrioleDbInAws,
}: Pick<
  PitrDisabledReasonOptions,
  'hasHipaaAddon' | 'sufficientPgVersion' | 'isOrioleDbInAws'
>) => {
  if (hasHipaaAddon) {
    return 'hipaa'
  }

  if (!sufficientPgVersion) {
    return 'legacy-project'
  }

  if (isOrioleDbInAws) {
    return 'orioledb'
  }

  return undefined
}
