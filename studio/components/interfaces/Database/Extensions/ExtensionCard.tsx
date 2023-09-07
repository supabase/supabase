import { PermissionAction } from '@supabase/shared-types/out/constants'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { Badge, IconExternalLink, IconLoader, Toggle } from 'ui'

import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'
import { useCheckPermissions, useStore } from 'hooks'
import { isResponseOk } from 'lib/common/fetch'
import EnableExtensionModal from './EnableExtensionModal'
import Link from 'next/link'
import { extensions } from 'shared-data'

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

  async function disableExtension() {
    confirmAlert({
      title: 'Confirm to disable extension',
      message: `Are you sure you want to turn OFF "${extension.name}" extension?`,
      onAsyncConfirm: async () => {
        try {
          setLoading(true)
          const response = await meta.extensions.del(extension.name)
          if (!isResponseOk(response)) {
            throw response.error
          } else {
            ui.setNotification({
              category: 'success',
              message: `${extension.name.toUpperCase()} is off.`,
            })
          }
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
      },
    })
  }

  return (
    <>
      <div
        className={[
          'flex border-panel-border-light dark:border-panel-border-dark',
          'flex-col overflow-hidden rounded border shadow-sm',
        ].join(' ')}
      >
        <div
          className={[
            'border-panel-border-light bg-panel-header-light dark:bg-panel-header-dark',
            'flex justify-between w-full border-b py-3 px-4 dark:border-panel-border-dark',
          ].join(' ')}
        >
          <div className="flex items-center gap-1 max-w-[85%]">
            <h3
              title={extension.name}
              className="h-5 m-0 text-sm uppercase truncate cursor-pointer text-scale-1200"
            >
              {extension.name}
            </h3>
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
              >
                <a className="max-w-[85%] cursor-default zans" target="_blank" rel="noreferrer">
                  <IconExternalLink className="ml-2.5 cursor-pointer" size={14} />
                </a>
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
              onChange={() => (isOn ? disableExtension() : enableExtension())}
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
            <p className="text-sm text-scale-1100 capitalize-sentence">{extension.comment}</p>
          </div>
          {isOn && extension.schema && (
            <div className="py-3 px-4">
              <div className="flex items-center flex-grow space-x-2 text-sm text-scale-1100">
                <span>Schema:</span>
                <Badge>{`${extension.schema}`}</Badge>
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
    </>
  )
}

export default observer(ExtensionCard)
