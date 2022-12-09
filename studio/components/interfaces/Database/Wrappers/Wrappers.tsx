import Link from 'next/link'
import { useState } from 'react'
import { Button, IconExternalLink } from 'ui'
import { observer } from 'mobx-react-lite'
import * as Tooltip from '@radix-ui/react-tooltip'
import { PostgresExtension } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { checkPermissions, useStore } from 'hooks'
import { useFDWsQuery } from 'data/fdw/fdws-query'
import { wrappers } from './Wrappers.constants'
import WrapperRow from './WrapperRow'
import { FormHeader } from 'components/ui/Forms'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'

const Wrappers = () => {
  const { ui, meta } = useStore()
  const { project } = useProjectContext()
  const { data, isLoading } = useFDWsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const enabledWrapperNamesSet = new Set(data?.result.map((fdw) => fdw.name))

  const [open, setOpen] = useState<string>('')
  const [isEnabling, setIsEnabling] = useState<boolean>(false)

  const [wrappersExtension] = meta.extensions.list(
    (ext: PostgresExtension) => ext.name.toLowerCase() === 'wrappers'
  )
  const isWrappersEnabled = wrappersExtension.installed_version !== null
  const canToggleWrappers = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'extensions')

  console.log('useFDWQuery', { data })

  console.log(wrappersExtension)

  const onEnableWrappers = async () => {
    if (wrappersExtension === undefined) return
    setIsEnabling(true)

    const { error: createExtensionError } = await meta.extensions.create({
      schema: wrappersExtension.schema ?? 'extensions',
      name: wrappersExtension.name,
      version: wrappersExtension.default_version,
      cascade: true,
    })
    if (createExtensionError) {
      ui.setNotification({
        error: createExtensionError,
        category: 'error',
        message: `Failed to enable Wrappers for your project: ${createExtensionError.message}`,
      })
    } else {
      ui.setNotification({
        category: 'success',
        message: 'Wrappers is now enabled for your project!',
      })
    }
    setIsEnabling(false)
  }

  return (
    <div>
      <FormHeader
        title="Foreign Data Wrappers"
        description="Query your data warehouse directly from your database, or third-party APIs using SQL."
      />

      {isWrappersEnabled ? (
        <div>
          {wrappers.map((wrapper) => {
            return (
              <WrapperRow
                wrapper={wrapper}
                isLoading={isLoading}
                isEnabled={enabledWrapperNamesSet.has(wrapper.server.name)}
                isOpen={open === wrapper.name}
                onOpen={(wrapperName) => {
                  if (open !== wrapperName) setOpen(wrapperName)
                  else setOpen('')
                }}
              />
            )
          })}
        </div>
      ) : (
        <div>
          <div
            className="px-12 py-12 w-full bg-scale-200 border border-scale-500 rounded bg-no-repeat"
            style={{
              backgroundSize: '45%',
              backgroundPosition: '112% 50%',
              backgroundImage: 'url("/img/vault.png")',
            }}
          >
            <div className="w-3/5 space-y-8">
              <div className="space-y-2">
                <h4 className="text-lg">Supabase Wrappers</h4>
                <p className="text-sm text-scale-1100">
                  Supabase Wrappers is a framework for building Postgres Foreign Data Wrappers (FDW)
                  which connect Postgres to external systems. Query your data warehouse or
                  third-party APIs directly from your database
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Link href="https://supabase.com/docs">
                  <a target="_blank">
                    <Button type="default" icon={<IconExternalLink />}>
                      About Wrappers
                    </Button>
                  </a>
                </Link>
                <Tooltip.Root delayDuration={0}>
                  <Tooltip.Trigger>
                    <Button
                      type="primary"
                      loading={isEnabling}
                      disabled={isEnabling || !canToggleWrappers}
                      onClick={() => onEnableWrappers()}
                    >
                      Enable Wrappers
                    </Button>
                  </Tooltip.Trigger>
                  {!canToggleWrappers && (
                    <Tooltip.Content side="bottom">
                      <Tooltip.Arrow className="radix-tooltip-arrow" />
                      <div
                        className={[
                          'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                          'border border-scale-200',
                        ].join(' ')}
                      >
                        <span className="text-xs text-scale-1200">
                          You need additional permissions to enable Wrappers for this project
                        </span>
                      </div>
                    </Tooltip.Content>
                  )}
                </Tooltip.Root>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* [Joshen TODO] Once above is working, can remove below */}
      {/* <div className="space-y-4 mt-20">
        <div className="w-full space-y-12">
          {enabledWrappers.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-lg">Enabled wrappers</h4>
              <div className="grid grid-cols-1 gap-6 mb-4 md:grid-cols-2 xl:grid-cols-3">
                {enabledWrappers.map((wrapper) => (
                  <WrapperCard key={wrapper.name} wrapper={wrapper} enabled={true} />
                ))}
              </div>
            </div>
          )}

          {disabledWrappers.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-lg">Available wrappers</h4>
              <div className="grid grid-cols-1 gap-6 mb-4 md:grid-cols-2 xl:grid-cols-3">
                {disabledWrappers.map((wrapper) => (
                  <WrapperCard key={wrapper.name} wrapper={wrapper} enabled={false} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div> */}
    </div>
  )
}

export default observer(Wrappers)
