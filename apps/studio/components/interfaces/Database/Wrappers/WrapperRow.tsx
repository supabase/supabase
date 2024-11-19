import { PermissionAction } from '@supabase/shared-types/out/constants'
import { partition } from 'lodash'
import { ChevronUp, Edit, ExternalLink, Trash } from 'lucide-react'
import Image from 'next/legacy/image'
import Link from 'next/link'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import type { FDW } from 'data/fdw/fdws-query'
import { EditorTablePageLink } from 'data/prefetchers/project.$ref.editor.$id'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Collapsible } from 'ui'
import type { WrapperMeta } from './Wrappers.types'

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
              <ChevronUp
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
                wrapperMeta.server.options.filter((option) => !option.hidden),
                'secureEntry'
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
                          <ExternalLink size={14} strokeWidth={1.5} />
                        </Link>
                      </div>
                    ))}
                    <div className="!mt-3 space-y-1">
                      <p className="text-sm text-foreground-light">
                        Foreign tables{wrapper.tables && `: (${wrapper.tables.length})`}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {wrapper.tables ? (
                          wrapper.tables.map((table) => (
                            <EditorTablePageLink
                              key={table.id}
                              projectRef={ref}
                              id={String(table.id)}
                            >
                              <div className="text-sm border rounded px-2 py-1 transition bg-surface-200 hover:bg-overlay-hover">
                                {table.name}
                              </div>
                            </EditorTablePageLink>
                          ))
                        ) : (
                          <p className="text-sm text-foreground-light">No tables available</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-x-2">
                    <ButtonTooltip
                      asChild
                      disabled={!canManageWrappers}
                      type="default"
                      icon={<Edit strokeWidth={1.5} />}
                      className="px-1.5 space-x-0"
                      tooltip={{
                        content: {
                          side: 'bottom',
                          text: !canManageWrappers
                            ? 'You need additional permissions to edit wrappers'
                            : 'Edit wrapper',
                        },
                      }}
                    >
                      <Link href={`/project/${ref}/integrations/wrappers/${wrapper.id}`}>
                        <span className="sr-only">Edit</span>
                      </Link>
                    </ButtonTooltip>
                    <ButtonTooltip
                      type="default"
                      disabled={!canManageWrappers}
                      icon={<Trash strokeWidth={1.5} />}
                      className="px-1.5"
                      onClick={() => onSelectDelete(wrapper)}
                      tooltip={{
                        content: {
                          side: 'bottom',
                          text: !canManageWrappers
                            ? 'You need additional permissions to delete wrappers'
                            : 'Delete wrapper',
                        },
                      }}
                    />
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
