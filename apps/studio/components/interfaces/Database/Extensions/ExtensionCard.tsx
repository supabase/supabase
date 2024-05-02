import { PermissionAction } from '@supabase/shared-types/out/constants'
import Link from 'next/link'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { extensions } from 'shared-data'
import { Badge, IconExternalLink, IconLoader, Toggle } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabaseExtensionDisableMutation } from 'data/database-extensions/database-extension-disable-mutation'
import { useCheckPermissions } from 'hooks'
import EnableExtensionModal from './EnableExtensionModal'

interface ExtensionCardProps {
  extension: any
}

const ExtensionCard = ({ extension }: ExtensionCardProps) => {
  const { project } = useProjectContext()
  const isOn = extension.installed_version !== null
  const [showConfirmEnableModal, setShowConfirmEnableModal] = useState(false)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''

  const { mutate: disableExtension, isLoading: isDisabling } = useDatabaseExtensionDisableMutation({
    onSuccess: () => {
      toast.success(`${extension.name} is off.`)
      setIsDisableModalOpen(false)
    },
  })

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

  const onConfirmDisable = () => {
    if (project === undefined) return console.error('Project is required')

    disableExtension({
      projectRef: project.ref,
      connectionString: project.connectionString,
      id: extension.name,
    })
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
                {extension.altName || extension.name}
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
          {isDisabling ? (
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
            'bg-panel-header-light',
            'bg-panel-secondary-light flex h-full flex-col justify-between',
          ].join(' ')}
        >
          <div className="py-3 px-4">
            <p className="text-sm text-foreground-light capitalize-sentence">{extension.comment}</p>
          </div>
          {isOn && extension.schema && (
            <div className="py-3 px-4">
              <div className="flex items-center flex-grow space-x-2 text-sm text-foreground-light">
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
      <ConfirmationModal
        visible={isDisableModalOpen}
        title="Confirm to disable extension"
        confirmLabel="Disable"
        confirmLabelLoading="Disabling"
        onCancel={() => setIsDisableModalOpen(false)}
        onConfirm={() => onConfirmDisable()}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you want to turn OFF the "{extension.name}" extension?
        </p>
      </ConfirmationModal>
    </>
  )
}

export default ExtensionCard
