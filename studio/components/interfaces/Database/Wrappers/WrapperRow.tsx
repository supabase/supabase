import Link from 'next/link'
import Image from 'next/image'
import { FC } from 'react'
import { Collapsible, IconChevronUp, Button, IconExternalLink, IconTrash, IconEdit } from 'ui'
import { partition } from 'lodash'

import { useParams, useStore } from 'hooks'
import { WrapperMeta } from './Wrappers.types'
import { FDW } from 'data/fdw/fdws-query'
import { useFDWDeleteMutation } from 'data/fdw/fdw-delete-mutation'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'

interface Props {
  wrappers: FDW[]
  wrapperMeta: WrapperMeta
  isOpen: boolean
  onOpen: (wrapper: string) => void
}

const WrapperRow: FC<Props> = ({ wrappers = [], wrapperMeta, isOpen, onOpen }) => {
  const { ui } = useStore()
  const { ref } = useParams()
  const { project } = useProjectContext()
  const { mutateAsync: deleteFDW } = useFDWDeleteMutation()

  const onDeleteWrapper = (wrapper: any) => {
    confirmAlert({
      title: `Confirm to disable ${wrapper.name}`,
      message: `Are you sure you want to disable the ${wrapper.name} wrapper? This will also remove all tables created with this wrapper.`,
      onAsyncConfirm: async () => {
        try {
          await deleteFDW({
            projectRef: project?.ref,
            connectionString: project?.connectionString,
            wrapper,
            wrapperMeta,
          })
          ui.setNotification({
            category: 'success',
            message: `Successfully disabled ${wrapper.name} foreign data wrapper`,
          })
        } catch (error: any) {
          ui.setNotification({
            error,
            category: 'error',
            message: `Failed to disable ${wrapper.name}: ${error.message}`,
          })
        }
      },
    })
  }

  return (
    <>
      <Collapsible
        open={isOpen}
        onOpenChange={() => onOpen(wrapperMeta.name)}
        className={[
          'bg-scale-100 dark:bg-scale-300 ',
          'hover:bg-scale-200 dark:hover:bg-scale-500',
          'data-open:bg-scale-200 dark:data-open:bg-scale-500',
          'border-scale-300',
          'dark:border-scale-500 hover:border-scale-500',
          'dark:hover:border-scale-700 data-open:border-scale-700',
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
            className="flex items-center justify-between w-full px-6 py-3 rounded group text-scale-1200"
          >
            <div className="flex items-center gap-3">
              <IconChevronUp
                className="transition text-scale-800 data-open-parent:rotate-0 data-closed-parent:rotate-180"
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
              <div className="px-3 py-1 text-xs border rounded-md border-scale-500 bg-scale-100 text-scale-1200 dark:border-scale-700 dark:bg-scale-300">
                {wrappers.length} wrapper{wrappers.length > 1 ? 's' : ''}
              </div>
            </div>
          </button>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <div className="border-t group border-scale-500 bg-scale-100 text-scale-1200 dark:bg-scale-300 divide-y">
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
                        className="flex items-center space-x-2 text-sm text-scale-1000"
                      >
                        <p>{metadata.label}:</p>
                        <p>{serverOptions[metadata.name]}</p>
                      </div>
                    ))}
                    {encryptedMetadata.map((metadata) => (
                      <div key={metadata.name} className="flex items-center space-x-2 text-sm">
                        <p className="text-scale-1000">{metadata.label}:</p>
                        <Link
                          href={`/project/${ref}/settings/vault/secrets?search=${wrapper.name}_${metadata.name}`}
                        >
                          <a className="transition text-scale-1000 hover:text-scale-1100 flex items-center space-x-2">
                            <span>Encrypted in Vault</span>
                            <IconExternalLink size={14} strokeWidth={1.5} />
                          </a>
                        </Link>
                      </div>
                    ))}
                    <div className="!mt-3 space-y-1">
                      <p className="text-sm text-scale-1100">
                        Foreign tables: ({wrapper.tables.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {wrapper.tables.map((table: any) => (
                          <Link href={`/project/${ref}/editor/${table.id}`}>
                            <a>
                              <div
                                key={table.id}
                                className="text-sm border rounded px-2 py-1 transition bg-scale-400 hover:bg-scale-500"
                              >
                                {table.name}
                              </div>
                            </a>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link href={`/project/${ref}/database/wrappers/${wrapper.id}`}>
                      <a>
                        <Button
                          type="default"
                          icon={<IconEdit strokeWidth={1.5} />}
                          className="py-2"
                        />
                      </a>
                    </Link>
                    <Button
                      type="default"
                      icon={<IconTrash strokeWidth={1.5} />}
                      className="py-2"
                      onClick={() => onDeleteWrapper(wrapper)}
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
