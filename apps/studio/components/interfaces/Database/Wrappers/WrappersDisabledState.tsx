import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabaseExtensionEnableMutation } from 'data/database-extensions/database-extension-enable-mutation'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { BASE_PATH } from 'lib/constants'
import { Button, IconExternalLink } from 'ui'

const WrappersDisabledState = () => {
  const { ref } = useParams()
  const { resolvedTheme } = useTheme()
  const { project } = useProjectContext()

  const { data } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const wrappersExtension = (data ?? []).find((ext) => ext.name === 'wrappers')
  const vaultExtension = (data ?? []).find((ext) => ext.name === 'supabase_vault')
  const isNotAvailable = wrappersExtension === undefined || vaultExtension === undefined

  const [isEnabling, setIsEnabling] = useState<boolean>(false)
  const canToggleWrappers = useCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'extensions'
  )

  const { mutateAsync: enableExtension } = useDatabaseExtensionEnableMutation({ onError: () => {} })

  const onEnableWrappers = async () => {
    if (wrappersExtension === undefined || vaultExtension === undefined) return
    if (project === undefined) return console.error('Project is required')

    let hasError = false

    try {
      setIsEnabling(true)
      await Promise.all([
        enableExtension({
          projectRef: project.ref,
          connectionString: project.connectionString,
          schema: wrappersExtension.schema ?? 'extensions',
          name: wrappersExtension.name,
          version: wrappersExtension.default_version,
          cascade: true,
        }),
        enableExtension({
          projectRef: project.ref,
          connectionString: project.connectionString,
          schema: vaultExtension.schema ?? 'vault',
          name: vaultExtension.name,
          version: vaultExtension.default_version,
          cascade: true,
        }),
      ])
    } catch (error: any) {
      if (!error.message.includes('already exists')) {
        hasError = true
        toast.error(`Failed to enable Wrappers: ${error.message}`)
      }
    } finally {
      setIsEnabling(false)
      if (!hasError) toast.success('Wrappers are now enabled!')
    }
  }

  return (
    <div>
      <div
        className="w-full px-12 py-12 bg-no-repeat border rounded-md bg-studio border-default"
        style={{
          backgroundSize: '45%',
          backgroundPosition: '105% 40%',
          backgroundImage: resolvedTheme?.includes('dark')
            ? `url("${BASE_PATH}/img/wrappers-dark.png")`
            : `url("${BASE_PATH}/img/wrappers-light.png")`,
        }}
      >
        <div className="w-3/5 space-y-8">
          <div className="space-y-2">
            <h4 className="text-lg">Supabase Wrappers</h4>
            <p className="text-sm text-foreground-light">
              Supabase Wrappers is a framework for building Postgres Foreign Data Wrappers (FDW)
              which connect Postgres to external systems. Query your data warehouse or third-party
              APIs directly from your database.
            </p>
          </div>
          {isNotAvailable ? (
            <div className="space-y-4">
              <div className="rounded border border-default px-4 py-2 flex items-center justify-between">
                <div>
                  <p className="text-foreground-light text-sm">
                    Wrappers is not available for this project yet.
                  </p>
                  <p className="text-foreground-light text-sm">
                    Do reach out to us if you're interested!
                  </p>
                </div>
                <div>
                  <Button asChild type="primary">
                    <Link
                      href={`/support/new?ref=${ref}&category=sales&subject=Request%20for%20access%20to%20wrappers`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Contact us
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-2 my-1 ml-[1px]">
                <Button asChild type="default" icon={<IconExternalLink />}>
                  <Link
                    href="https://supabase.com/docs/guides/database/extensions/wrappers/overview"
                    target="_blank"
                    rel="noreferrer"
                  >
                    About Wrappers
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button asChild type="default" icon={<IconExternalLink />}>
                <Link
                  href="https://supabase.com/docs/guides/database/extensions/wrappers/overview"
                  target="_blank"
                  rel="noreferrer"
                >
                  About Wrappers
                </Link>
              </Button>
              <Tooltip.Root delayDuration={0}>
                <Tooltip.Trigger asChild>
                  <Button
                    type="primary"
                    loading={isEnabling}
                    disabled={isNotAvailable || isEnabling || !canToggleWrappers}
                    onClick={() => onEnableWrappers()}
                  >
                    Enable Wrappers
                  </Button>
                </Tooltip.Trigger>
                {!canToggleWrappers && (
                  <Tooltip.Portal>
                    <Tooltip.Content side="bottom">
                      <Tooltip.Arrow className="radix-tooltip-arrow" />
                      <div
                        className={[
                          'rounded bg-alternative py-1 px-2 leading-none shadow',
                          'border border-background',
                        ].join(' ')}
                      >
                        <span className="text-xs text-foreground">
                          You need additional permissions to enable Wrappers for this project
                        </span>
                      </div>
                    </Tooltip.Content>
                  </Tooltip.Portal>
                )}
              </Tooltip.Root>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WrappersDisabledState
