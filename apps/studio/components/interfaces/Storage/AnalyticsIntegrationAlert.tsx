import { InlineLink } from 'components/ui/InlineLink'
import { useAnalyticsIntegrationStatus } from 'hooks/useAnalyticsIntegrationStatus'
import { DOCS_URL } from 'lib/constants'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'

interface AnalyticsIntegrationAlertProps {
  context?: 'modal' | 'page' | 'bucket'
  variant?: 'warning' | 'default'
  showInstallButton?: boolean
  onInstall?: () => void
  className?: string
}

export const AnalyticsIntegrationAlert = ({
  context = 'page',
  variant = 'warning',
  showInstallButton = false,
  onInstall,
  className,
}: AnalyticsIntegrationAlertProps) => {
  const {
    isLoading,
    extensionState,
    installationContext,
    needsWrappersExtension,
    needsIcebergWrapper,
  } = useAnalyticsIntegrationStatus(context)

  // Don't show alert while data is loading or if everything is installed
  if (isLoading || extensionState === 'installed') {
    return null
  }

  // Determine the appropriate message based on context
  const getMessage = () => {
    if (installationContext.canAutoInstall) {
      // Modal context - passive installation
      return (
        <p>
          {installationContext.installationMessage}{' '}
          <InlineLink
            href={`${DOCS_URL}/guides/database/extensions/wrappers/iceberg`}
            target="_blank"
            rel="noreferrer"
            className="text-foreground-lighter hover:text-foreground transition-colors"
          >
            Learn more
          </InlineLink>
        </p>
      )
    } else {
      // Page context - requires user action
      return (
        <p>
          {installationContext.installationMessage}{' '}
          <InlineLink
            href={`${DOCS_URL}/guides/database/extensions/wrappers/iceberg`}
            target="_blank"
            rel="noreferrer"
            className="text-foreground-lighter hover:text-foreground transition-colors"
          >
            Learn more
          </InlineLink>
        </p>
      )
    }
  }

  return (
    <Admonition type={variant} className={className}>
      {getMessage()}
      {showInstallButton && onInstall && installationContext.requiresUserAction && (
        <Button type="warning" className="mt-3" onClick={onInstall}>
          Install
        </Button>
      )}
    </Admonition>
  )
}
