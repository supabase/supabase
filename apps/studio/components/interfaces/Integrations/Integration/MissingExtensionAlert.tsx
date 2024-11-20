import { useState } from 'react'

import EnableExtensionModal from 'components/interfaces/Database/Extensions/EnableExtensionModal'
import { DatabaseExtension } from 'data/database-extensions/database-extensions-query'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  WarningIcon,
} from 'ui'

export const MissingExtensionAlert = ({ extension }: { extension: DatabaseExtension }) => {
  const [showEnableExtensionModal, setShowEnableExtensionModal] = useState(false)

  const extensionInstalled = !!extension?.installed_version
  if (!extensionInstalled) {
    return (
      <>
        <Alert_Shadcn_ variant="warning">
          <WarningIcon />
          <AlertTitle_Shadcn_>Missing dependencies.</AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_ className="flex gap-2 flex-col">
            <div>The "{extension.name}" extension is needed for this integration to work.</div>
            <Button onClick={() => setShowEnableExtensionModal(true)} className="w-fit">
              Enable {extension.name}
            </Button>
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>

        <EnableExtensionModal
          visible={showEnableExtensionModal}
          extension={extension}
          onCancel={() => setShowEnableExtensionModal(false)}
        />
      </>
    )
  }
  return null
}
