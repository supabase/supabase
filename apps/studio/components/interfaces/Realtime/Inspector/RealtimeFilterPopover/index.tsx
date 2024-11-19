import { PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { Dispatch, SetStateAction, useState } from 'react'

import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import {
  Badge,
  Button,
  IconBroadcast,
  IconDatabaseChanges,
  IconPresence,
  Input,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  Toggle,
  cn,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { RealtimeConfig } from '../useRealtimeMessages'
import { FilterSchema } from './FilterSchema'
import { FilterTable } from './FilterTable'

interface RealtimeFilterPopoverProps {
  config: RealtimeConfig
  onChangeConfig: Dispatch<SetStateAction<RealtimeConfig>>
}

export const RealtimeFilterPopover = ({ config, onChangeConfig }: RealtimeFilterPopoverProps) => {
  const [open, setOpen] = useState(false)
  const [applyConfigOpen, setApplyConfigOpen] = useState(false)
  const [tempConfig, setTempConfig] = useState(config)

  const { mutate: sendEvent } = useSendEventMutation()

  const onOpen = (v: boolean) => {
    // when opening, copy the outside config into the intermediate one
    if (v === true) {
      setTempConfig(config)
    }
    setOpen(v)
  }

  // [Joshen] Restricting the schemas to only public as any other schema won’t work out of the box due to missing permissions
  // Consequently, SchemaSelector here will also be disabled
  const isFiltered = config.table !== '*'

  return (
    <>
      <Popover_Shadcn_ open={open} onOpenChange={onOpen}>
        <PopoverTrigger_Shadcn_ asChild>
          <Button
            icon={<PlusCircle size="16" />}
            type={isFiltered ? 'primary' : 'dashed'}
            className={cn('rounded-full px-1.5 text-xs', isFiltered ? '!py-0.5' : '!py-1')}
            size="small"
          >
            {isFiltered ? (
              <>
                <span className="mr-1">Filtered by </span>
                <Badge variant="brand">table: {config.table}</Badge>
              </>
            ) : (
              <span className="mr-1">Filter messages</span>
            )}
          </Button>
        </PopoverTrigger_Shadcn_>
        <PopoverContent_Shadcn_ className="p-0 w-[365px]" align="start">
          <div className="border-b border-overlay text-xs px-4 py-3 text-foreground">
            Listen to event types
          </div>
          <div className="py-3 px-4 border-b border-overlay">
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-2.5 items-center">
                <IconPresence
                  size="xlarge"
                  className="bg-foreground rounded text-background-muted"
                />
                <label htmlFor="toggle-presence" className="text-sm">
                  Presence
                </label>
              </div>
              <Toggle
                id="toggle-presence"
                size="tiny"
                checked={tempConfig.enablePresence}
                onChange={() =>
                  setTempConfig({ ...tempConfig, enablePresence: !tempConfig.enablePresence })
                }
              />
            </div>
            <p className="text-xs text-foreground-light pt-1">
              Store and synchronize user state consistently across clients
            </p>
          </div>
          <div className="py-3 px-4 border-b border-overlay">
            <div className="flex items-center justify-between">
              <div className="flex gap-2.5 items-center">
                <IconBroadcast
                  size="xlarge"
                  className="bg-foreground rounded text-background-muted"
                />
                <label htmlFor="toggle-broadcast" className="text-sm">
                  Broadcast
                </label>
              </div>
              <Toggle
                id="toggle-broadcast"
                size="tiny"
                checked={tempConfig.enableBroadcast}
                onChange={() =>
                  setTempConfig({ ...tempConfig, enableBroadcast: !tempConfig.enableBroadcast })
                }
              />
            </div>
            <p className="text-xs  text-foreground-light pt-1">
              Send any data to any client subscribed to the same channel
            </p>
          </div>
          <div className="py-3 px-4 border-b border-overlay">
            <div className="flex items-center justify-between">
              <div className="flex gap-2.5 items-center">
                <IconDatabaseChanges
                  size="xlarge"
                  className="bg-foreground rounded text-background-muted"
                />
                <label htmlFor="toggle-db-changes" className="text-sm">
                  Database changes
                </label>
              </div>
              <Toggle
                id="toggle-db-changes"
                size="tiny"
                checked={tempConfig.enableDbChanges}
                onChange={() =>
                  setTempConfig({ ...tempConfig, enableDbChanges: !tempConfig.enableDbChanges })
                }
              />
            </div>
            <p className="text-xs text-foreground-light pt-1">
              Listen for Database inserts, updates, deletes and more
            </p>
          </div>

          {tempConfig.enableDbChanges && (
            <>
              <div className="border-b border-overlay text-xs px-4 py-3 text-foreground">
                Filter messages from database changes
              </div>
              <div className="flex border-b border-overlay p-4 gap-y-2 flex-col">
                <FilterSchema
                  value={tempConfig.schema}
                  onChange={(v) => setTempConfig({ ...tempConfig, schema: v, table: '*' })}
                />

                <FilterTable
                  value={tempConfig.table}
                  schema={tempConfig.schema}
                  onChange={(table) => setTempConfig({ ...tempConfig, table })}
                />
              </div>
              <div className="border-b border-overlay p-4 flex flex-col gap-2">
                <div className="flex flex-row gap-4 items-center">
                  <p className="w-[60px] flex justify-end text-sm">AND</p>
                  <Input
                    size="tiny"
                    className="flex-grow"
                    placeholder="body=eq.hey"
                    value={tempConfig.filter}
                    onChange={(v) => setTempConfig({ ...tempConfig, filter: v.target.value })}
                  />
                </div>
                <p className="text-xs text-foreground-light pl-[80px]">
                  Learn more about realtime filtering in{' '}
                  <Link
                    className="underline"
                    target="_blank"
                    rel="noreferrer"
                    href="https://supabase.com/docs/guides/realtime/postgres-changes#available-filters"
                  >
                    our docs
                  </Link>
                </p>
              </div>
            </>
          )}
          <div className="px-4 py-2 gap-2 flex justify-end">
            <Button type="default" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setApplyConfigOpen(true)}>Apply</Button>
          </div>
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>
      <ConfirmationModal
        title="Previously found messages will be lost"
        variant="destructive"
        confirmLabel="Confirm"
        size="small"
        visible={applyConfigOpen}
        onCancel={() => setApplyConfigOpen(false)}
        onConfirm={() => {
          sendEvent({
            category: 'realtime_inspector',
            action: 'applied_filters',
            label: 'realtime_inspector_config',
          })
          onChangeConfig(tempConfig)
          setApplyConfigOpen(false)
          setOpen(false)
        }}
      >
        <p className="text-sm text-foreground-light">
          The realtime inspector will clear currently collected messages and start listening for new
          messages matching the updated filters.
        </p>
      </ConfirmationModal>
    </>
  )
}
