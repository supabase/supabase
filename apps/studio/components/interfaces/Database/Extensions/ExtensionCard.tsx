import { PermissionAction } from '@supabase/shared-types/out/constants'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'

import ConfirmationModal from 'components/ui/ConfirmationModal'
import { useCheckPermissions, useStore } from 'hooks'
import { isResponseOk } from 'lib/common/fetch'
import Link from 'next/link'
import { extensions } from 'shared-data'
import { Badge, IconExternalLink, IconLoader, Modal, Toggle } from 'ui'
import EnableExtensionModal from './EnableExtensionModal'

interface ExtensionCardProps {
  extension: any
}

const ExtensionCard = ({ extension }: ExtensionCardProps) => {
  const { ui, meta } = useStore()

  const isOn = extension.installed_version !== null
  const [loading, setLoading] = useState(false)
  const [showConfirmEnableModal, setShowConfirmEnableModal] = useState(false)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''

  const canUpdateExtensions = useCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'extensions'
  )

  async function enableExtension() {
    return setShowConfirmEnableModal(true)
  }

  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false)
  function openDisableModal() {
    setIsDisableModalOpen(true)
  }

  async function disableExtension() {
    try {
      setLoading(true)
      const response = await meta.extensions.del(extension.name)
      if (!isResponseOk(response)) {
        throw response.error
      }

      ui.setNotification({
        category: 'success',
        message: `${extension.name.toUpperCase()} is off.`,
      })
      setIsDisableModalOpen(false)
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Toggle ${extension.name.toUpperCase()} failed: ${error.message}`,
      })
    } finally {
      // Need to reload them because the delete function
      // removes the extension from the store
      meta.extensions.load()
      setLoading(false)
    }
  }

  return (
    <>
      <div
        className={[
          'flex border-overlay',
          'flex-col overflow-hidden rounded border shadow-sm',
        ].join(' ')}
      >
        <div
          className={[
            'border-overlay bg-surface-100',
            'flex justify-between w-full border-b py-3 px-4',
          ].join(' ')}
        >
          <div className="flex items-center gap-1 max-w-[85%]">
            <div className="flex items-center space-x-2 truncate">
              <h3
                title={extension.name}
                className="h-5 m-0 text-sm truncate cursor-pointer text-foreground"
              >
                {extension.name}
              </h3>
              <p className="text-sm text-foreground-light">
                {extension?.installed_version ?? extension.default_version}
              </p>
            </div>
            {extensions.find((item: any) => item.name === extension.name) ? (
              <Link
                href={
                  extensions
                    .find((item: any) => item.name === extension.name)
                    ?.link.startsWith('/guides')
                    ? siteUrl === 'http://localhost:8082'
                      ? `http://localhost:3001/docs${
                          extensions.find((item: any) => item.name === extension.name)?.link
                        }`
                      : `https://supabase.com/docs${
                          extensions.find((item: any) => item.name === extension.name)?.link
                        }`
                    : extensions.find((item: any) => item.name === extension.name)?.link ?? ''
                }
                className="max-w-[85%] cursor-default zans"
                target="_blank"
                rel="noreferrer"
              >
                <IconExternalLink className="ml-2.5 cursor-pointer" size={14} />
              </Link>
            ) : null}
          </div>
          {loading ? (
            <IconLoader className="animate-spin" size={16} />
          ) : (
            <Toggle
              size="tiny"
              checked={isOn}
              disabled={!canUpdateExtensions}
              onChange={() => (isOn ? openDisableModal() : enableExtension())}
            />
          )}
        </div>
        <div
          className={[
            'bg-panel-header-light dark:bg-panel-header-dark',
            'bg-panel-secondary-light dark:bg-panel-secondary-dark flex h-full flex-col justify-between',
          ].join(' ')}
        >
          <div className="py-3 px-4">
            <p className="text-sm text-foreground-light capitalize-sentence">{extension.comment}</p>
          </div>
          {isOn && extension.schema && (
            <div className="py-3 px-4">
              <div className="flex items-center flex-grow space-x-2 text-sm text-foreground-light">
                <span>Schema:</span>
                <Badge color="scale">{`${extension.schema}`}</Badge>
              </div>
            </div>
          )}
        </div>
      </div>

      <EnableExtensionModal
        visible={showConfirmEnableModal}
        extension={extension}
        onCancel={() => setShowConfirmEnableModal(false)}
      />
      <ConfirmationModal
        visible={isDisableModalOpen}
        header="Confirm to disable extension"
        buttonLabel="Disable"
        onSelectCancel={() => setIsDisableModalOpen(false)}
        onSelectConfirm={() => {
          disableExtension()
        }}
      >
        <Modal.Content>
          <p className="py-4 text-sm text-foreground-light">
            Are you sure you want to turn OFF "{extension.name}" extension?
          </p>
        </Modal.Content>
      </ConfirmationModal>
    </>
  )
}

export default observer(ExtensionCard)
