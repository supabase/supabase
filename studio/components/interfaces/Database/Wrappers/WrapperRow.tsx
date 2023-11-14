import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { partition } from 'lodash'
import Image from 'next/legacy/image'
import Link from 'next/link'
import { Button, Collapsible, IconChevronUp, IconEdit, IconExternalLink, IconTrash } from 'ui'

import { useParams } from 'common/hooks'
import { FDW } from 'data/fdw/fdws-query'
import { useCheckPermissions } from 'hooks'
import { WrapperMeta } from './Wrappers.types'

interface WrapperRowProps {
  wrappers: FDW[]
  wrapperMeta: WrapperMeta
  isOpen: boolean
  onOpen: (wrapper: string) => void
  onSelectDelete: (wrapper: FDW) => void
}

const WrapperRow = ({
  wrappers = [],
  wrapperMeta,
  isOpen,
  onOpen,
  onSelectDelete,
}: WrapperRowProps) => {
  const { ref } = useParams()
  const canManageWrappers = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'wrappers')

  return (
    <>
      <Collapsible
        open={isOpen}
        onOpenChange={() => onOpen(wrapperMeta.name)}
        className={[
          'bg-surface-100',
          'hover:bg-overlay-hover',
          'data-open:bg-selection',
          'border-default',
          'hover:border-strong',
          'data-open:border-strong',
          'col-span-12 mx-auto',
          '-space-y-px overflow-hidden',
          'transition border shadow hover:z-50',
          'first:rounded-tl first:rounded-tr first:!border-t',
          'last:rounded-bl last:rounded-br last:border-t-0',
        ].join(' ')}
      >
        <Collapsible.Trigger asChild>
          <button
            type="button"
            className="flex items-center justify-between w-full px-6 py-3 rounded group text-foreground"
          >
            <div className="flex items-center gap-3">
              <IconChevronUp
                className="transition text-border-stronger data-open-parent:rotate-0 data-closed-parent:rotate-180"
                strokeWidth={2}
                width={14}
              />
              <Image
                src={wrapperMeta.icon}
                width={20}
                height={20}
                alt={`${wrapperMeta.name} wrapper icon`}
              />
              <span className="text-sm capitalize">{wrapperMeta.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 text-xs border rounded-md border-strong bg-surface-100 text-foreground">
                {wrappers.length} wrapper{wrappers.length > 1 ? 's' : ''}
              </div>
            </div>
          </button>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <div className="border-t group border-strong bg-surface-100 text-foreground divide-y">
            {wrappers.map((wrapper) => {
              const serverOptions = Object.fromEntries(
                wrapper.server_options.map((option: any) => option.split('='))
              )
              const [encryptedMetadata, visibleMetadata] = partition(
                wrapperMeta.server.options,
                'hidden'
              )

              return (
                <div key={wrapper.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="space-y-1 w-3/4">
                    <div className="flex items-center space-x-2">
                      <p className="text-base">{wrapper.name}</p>
                    </div>
                    {visibleMetadata.map((metadata) => (
                      <div
                        key={metadata.name}
                        className="flex items-center space-x-2 text-sm text-foreground-light"
                      >
                        <p>{metadata.label}:</p>
                        <p>{serverOptions[metadata.name]}</p>
                      </div>
                    ))}
                    {encryptedMetadata.map((metadata) => (
                      <div key={metadata.name} className="flex items-center space-x-2 text-sm">
                        <p className="text-foreground-light">{metadata.label}:</p>
                        <Link
                          href={`/project/${ref}/settings/vault/secrets?search=${wrapper.name}_${metadata.name}`}
                          className="transition text-foreground-light hover:text-foreground flex items-center space-x-2"
                        >
                          <span>Encrypted in Vault</span>
                          <IconExternalLink size={14} strokeWidth={1.5} />
                        </Link>
                      </div>
                    ))}
                    <div className="!mt-3 space-y-1">
                      <p className="text-sm text-foreground-light">
                        Foreign tables{wrapper.tables && `: (${wrapper.tables.length})`}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {wrapper.tables ? (
                          wrapper.tables.map((table: any) => (
                            <Link key={table.id} href={`/project/${ref}/editor/${table.id}`}>
                              <div className="text-sm border rounded px-2 py-1 transition bg-surface-200 hover:bg-overlay-hover">
                                {table.name}
                              </div>
                            </Link>
                          ))
                        ) : (
                          <p className="text-sm text-foreground-light">No tables available</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {canManageWrappers ? (
                      <Link href={`/project/${ref}/database/wrappers/${wrapper.id}`}>
                        <Button
                          type="default"
                          icon={<IconEdit strokeWidth={1.5} />}
                          className="py-2"
                        />
                      </Link>
                    ) : (
                      <Tooltip.Root delayDuration={0}>
                        <Tooltip.Trigger>
                          <Button
                            type="default"
                            disabled
                            icon={<IconEdit strokeWidth={1.5} />}
                            className="py-2"
                          />
                        </Tooltip.Trigger>
                        {!canManageWrappers && (
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
                                  You need additional permissions to edit wrappers
                                </span>
                              </div>
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        )}
                      </Tooltip.Root>
                    )}
                    <Tooltip.Root delayDuration={0}>
                      <Tooltip.Trigger>
                        <Button
                          type="default"
                          disabled={!canManageWrappers}
                          icon={<IconTrash strokeWidth={1.5} />}
                          className="py-2"
                          onClick={() => onSelectDelete(wrapper)}
                        />
                      </Tooltip.Trigger>
                      {!canManageWrappers && (
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
                                You need additional permissions to add wrappers
                              </span>
                            </div>
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      )}
                    </Tooltip.Root>
                  </div>
                </div>
              )
            })}
          </div>
        </Collapsible.Content>
      </Collapsible>
    </>
  )
}

export default WrapperRow
