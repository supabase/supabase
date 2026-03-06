import { useParams } from 'common'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'

import { ContactSupportButton } from '@/components/ui/AlertError'

export const InstallationError = ({
  error,
  handleUninstall,
  handleOpenInstallSheet,
}: {
  error: 'install' | 'uninstall'
  handleUninstall: () => void
  handleOpenInstallSheet: () => void
}) => {
  const { ref } = useParams()

  if (error === 'uninstall') {
    return (
      <Admonition
        type="warning"
        layout="responsive"
        title="Failed to uninstall Stripe Sync Engine"
        description="There was an error during the uninstallation of the Stripe Sync Engine, please try again. If the problem persists, contact support."
        actions={
          <div className="flex items-center gap-x-2">
            <Button type="default" onClick={handleUninstall}>
              Retry uninstall
            </Button>
            <ContactSupportButton
              projectRef={ref}
              subject="Failed to uninstall Stripe Sync Engine"
            />
          </div>
        }
      />
    )
  }

  if (error === 'install') {
    return (
      <Admonition
        type="warning"
        layout="responsive"
        title="Failed to install Stripe Sync Engine"
        description="There was an error during the installation of the Stripe Sync Engine, please try reinstalling the integration. If the problem persists, contact support."
        actions={
          <div className="flex items-center gap-x-2">
            <Button type="default" onClick={handleOpenInstallSheet}>
              Retry install
            </Button>
            <ContactSupportButton projectRef={ref} subject="Failed to install Stripe Sync Engine" />
          </div>
        }
      />
    )
  }

  return null
}
