import { useState } from 'react'
import { Button, Modal } from 'ui'

import { useStore } from 'hooks'
import { AddNewUrlModal } from './AddNewUrlModal'
import { CustomOpenIdUrlsList } from './CustomOpenIdUrlsList'

export const CustomOpenIdUrls = ({ postgrestConfig }: { postgrestConfig: any }) => {
  const [showAddNewUrl, setShowAddNewUrl] = useState(false)
  const [selectedUrlToDelete, setSelectedUrlToDelete] = useState<string>()

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="text-scale-900 text-sm">
          <div>You can add foreign JWT keys by adding their OpenID URL.</div>
        </div>
        <Button onClick={() => setShowAddNewUrl(true)}>Add URL</Button>
      </div>
      <CustomOpenIdUrlsList
        onSelectUrlToDelete={(url) => setSelectedUrlToDelete(url)}
        canUpdate={false}
      />
      {showAddNewUrl ? (
        <AddNewUrlModal visible={showAddNewUrl} onClose={() => setShowAddNewUrl(false)} />
      ) : null}
      {selectedUrlToDelete ? (
        <RemoveUrlModal
          selectedUrl={selectedUrlToDelete}
          onClose={() => setSelectedUrlToDelete(undefined)}
        />
      ) : null}
    </>
  )
}

const RemoveUrlModal = ({ selectedUrl, onClose }: { selectedUrl: string; onClose: () => void }) => {
  const { ui } = useStore()
  const [isDeleting, setIsDeleting] = useState(false)

  const onConfirmDeleteUrl = async () => {
    setIsDeleting(true)

    // TODO: make this work
    const payload = '' //URI_ALLOW_LIST_ARRAY.filter((e: string) => e !== url)

    // const { error } = await authConfig.update({ URI_ALLOW_LIST: payload.toString() })

    // if (!error) {
    //   onClose()
    //   ui.setNotification({ category: 'success', message: 'Successfully removed URL' })
    // } else {
    //   ui.setNotification({
    //     error,
    //     category: 'error',
    //     message: `Failed to remove URL: ${error?.message}`,
    //   })
    // }

    setIsDeleting(false)
  }

  return (
    <Modal
      hideFooter
      size="small"
      visible
      header={<h3 className="text-sm">Remove URL</h3>}
      onCancel={onClose}
    >
      <div className="mb-4 space-y-4 pt-4">
        <div className="px-5">
          <p className="mb-2 text-sm text-scale-1100">
            Are you sure you want to remove <span className="text-scale-1200">{selectedUrl}</span>?
          </p>
          <p className="text-scale-1100 text-sm">
            This URL will no longer work with your authentication configuration.
          </p>
        </div>
        <div className="border-overlay-border border-t"></div>
        <div className="flex gap-3 px-5">
          <Button block type="default" size="medium" onClick={onClose}>
            Cancel
          </Button>
          <Button
            block
            size="medium"
            type="warning"
            loading={isDeleting}
            onClick={() => onConfirmDeleteUrl()}
          >
            {isDeleting ? 'Removing...' : 'Remove URL'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
