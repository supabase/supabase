import { EnableExtensionModal } from 'components/interfaces/Database/Extensions/EnableExtensionModal'
import { DatabaseExtension } from 'data/database-extensions/database-extensions-query'
import { useState } from 'react'
import { Button } from 'ui'

export const MissingExtensionAlert = ({ extension }: { extension: DatabaseExtension }) => {
  const [showEnableExtensionModal, setShowEnableExtensionModal] = useState(false)

  const extensionInstalled = !!extension?.installed_version
  if (!extensionInstalled) {
    return (
      <>
        <Button type="primary" className="w-min" onClick={() => setShowEnableExtensionModal(true)}>
          Enable {extension.name}
        </Button>

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
