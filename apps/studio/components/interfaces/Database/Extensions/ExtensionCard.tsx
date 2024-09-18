import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Book, Github, Loader2, Settings } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabaseExtensionDisableMutation } from 'data/database-extensions/database-extension-disable-mutation'
import { DatabaseExtension } from 'data/database-extensions/database-extensions-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { extensions } from 'shared-data'
import { Button, cn, Switch } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import EnableExtensionModal from './EnableExtensionModal'

interface ExtensionCardProps {
  extension: DatabaseExtension
}

const ExtensionCard = ({ extension }: ExtensionCardProps) => {
  const { project } = useProjectContext()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  const isOn = extension.installed_version !== null

  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false)
  const [showConfirmEnableModal, setShowConfirmEnableModal] = useState(false)

  const canUpdateExtensions = useCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'extensions'
  )

  const X_PADDING = 'px-5'
  const extensionMeta = extensions.find((item: any) => item.name === extension.name)
  const docsUrl = extensionMeta?.link.startsWith('/guides')
    ? siteUrl === 'http://localhost:8082'
      ? `http://localhost:3001/docs${extensions.find((item) => item.name === extension.name)?.link}`
      : `https://supabase.com/docs${extensions.find((item) => item.name === extension.name)?.link}`
    : extensions.find((item: any) => item.name === extension.name)?.link ?? undefined

  const { mutate: disableExtension, isLoading: isDisabling } = useDatabaseExtensionDisableMutation({
    onSuccess: () => {
      toast.success(`${extension.name} is off.`)
      setIsDisableModalOpen(false)
    },
  })

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
      <div className="bg-surface-100 border border-overlay flex flex-col overflow-hidden rounded shadow-sm">
        <div className={cn('border-b border-overlay flex justify-between w-full py-3', X_PADDING)}>
          <div className="max-w-[85%] flex items-center space-x-3 truncate">
            <h3
              title={extension.name}
              className="h-5 m-0 text-sm truncate cursor-pointer text-foreground"
            >
              {extension.name}
            </h3>
            <p className="text-sm text-foreground-light font-mono tracking-tighter">
              {extension?.installed_version ?? extension.default_version}
            </p>
          </div>

          {isDisabling ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Switch
              disabled={!canUpdateExtensions}
              checked={isOn}
              onCheckedChange={() =>
                isOn ? setIsDisableModalOpen(true) : setShowConfirmEnableModal(true)
              }
            />
          )}
        </div>

        {isOn && (
          <div className={cn('border-b border-overlay py-2', X_PADDING)}>
            <p className="text-foreground-light text-sm">
              Installed in <span className="text-foreground">{extension.schema}</span> schema
            </p>
          </div>
        )}

        <div className={cn('flex h-full flex-col gap-y-3 py-3', X_PADDING)}>
          <p className="text-sm text-foreground-light capitalize-sentence">{extension.comment}</p>
          <div className="flex items-center gap-x-2">
            {extensionMeta?.github_url && (
              <Button asChild type="default" icon={<Github />} className="rounded-full">
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={extensionMeta.github_url}
                  className="font-mono tracking-tighter"
                >
                  {extensionMeta.github_url.split('/').slice(-2).join('/')}
                </a>
              </Button>
            )}
            {docsUrl !== undefined && (
              <Button asChild type="default" icon={<Book />} className="rounded-full">
                <a
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono tracking-tighter"
                  href={docsUrl}
                >
                  Docs
                </a>
              </Button>
            )}
          </div>
        </div>

        {extensionMeta?.product && (
          <div className={cn('border-t border-overlay py-3 flex items-center gap-x-3', X_PADDING)}>
            <div className="min-w-5 w-5 h-5 border border-brand/50 rounded flex items-center justify-center">
              <Settings className="text-brand" size={12} />
            </div>
            <div>
              <p className="text-foreground-light text-xs">
                <span className="text-foreground">{extension.name}</span> is used by{' '}
                {extensionMeta.product_url ? (
                  <Link
                    href={extensionMeta.product_url.replace('{ref}', project?.ref ?? '')}
                    className="transition hover:text-foreground"
                  >
                    {extensionMeta.product}
                  </Link>
                ) : (
                  extensionMeta.product
                )}
              </p>
              {!isOn && (
                <p className="text-foreground-lighter text-xs">
                  Install extension to use {extensionMeta.product}
                </p>
              )}
            </div>
          </div>
        )}
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
