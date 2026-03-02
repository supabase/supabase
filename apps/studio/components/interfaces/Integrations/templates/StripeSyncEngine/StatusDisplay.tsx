import { AlertCircle, Check, RefreshCwIcon } from 'lucide-react'

import {
  hasInstallError,
  hasUninstallError,
  isInstalled,
  isInstalling,
  isUninstalling,
  SchemaInstallationStatus,
} from './stripe-sync-status'

export const StatusDisplay = ({
  status,
  isInstallRequested,
  isUninstallRequested,
}: {
  status: SchemaInstallationStatus
  isInstallRequested: boolean
  isUninstallRequested: boolean
}) => {
  const installed = isInstalled(status)
  const installError = hasInstallError(status)
  const uninstallError = hasUninstallError(status)
  const installInProgress = isInstalling(status)
  const uninstallInProgress = isUninstalling(status)

  const installing = installInProgress || isInstallRequested
  const uninstalling = uninstallInProgress || isUninstallRequested

  if (uninstallError) {
    return (
      <span className="flex items-center gap-2 text-foreground-light text-sm">
        <AlertCircle size={14} className="text-destructive" />
        Uninstallation error
      </span>
    )
  }
  if (uninstalling) {
    return (
      <span className="flex items-center gap-2 text-foreground-light text-sm">
        <RefreshCwIcon size={14} className="animate-spin text-foreground-lighter" />
        Uninstalling...
      </span>
    )
  }
  if (installError) {
    return (
      <span className="flex items-center gap-2 text-foreground-light text-sm">
        <AlertCircle size={14} className="text-destructive" />
        Installation error
      </span>
    )
  }
  if (installing) {
    return (
      <span className="flex items-center gap-2 text-foreground-light text-sm">
        <RefreshCwIcon size={14} className="animate-spin text-foreground-lighter" />
        Installing...
      </span>
    )
  }
  if (installed) {
    return (
      <span className="flex items-center gap-2 text-foreground-light text-sm">
        <Check size={14} strokeWidth={1.5} className="text-brand" /> Installed
      </span>
    )
  }
  return (
    <span className="flex items-center gap-2 text-foreground-light text-sm">Not installed</span>
  )
}
