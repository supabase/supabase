import { PlusCircle } from 'lucide-react'
import { Dispatch, SetStateAction, useState } from 'react'
import {
  Badge,
  Button,
  Input,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  cn,
} from 'ui'

import Link from 'next/link'
import { ApplyConfigModal } from '../ApplyConfigModal'
import { RealtimeConfig } from '../useRealtimeMessages'
import { FilterSchema } from './FilterSchema'
import { TableSchema } from './TableSchema'

interface RealtimeFilterPopoverProps {
  config: RealtimeConfig
  onChangeConfig: Dispatch<SetStateAction<RealtimeConfig>>
}

export const RealtimeFilterPopover = ({ config, onChangeConfig }: RealtimeFilterPopoverProps) => {
  const [open, setOpen] = useState(false)
  const [applyConfigOpen, setApplyConfigOpen] = useState(false)
  const [tempConfig, setTempConfig] = useState(config)

  const onOpen = (v: boolean) => {
    // when opening, copy the outside config into the intermediate one
    if (v === true) {
      setTempConfig(config)
    }
    setOpen(v)
  }

  const isFiltered = config.schema !== '*'

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
                <Badge className="!bg-brand-400 !text-brand-600">
                  schema: {config.schema === '*' ? 'All schemas' : config.schema}
                </Badge>
              </>
            ) : (
              <span className="mr-1">Filter messages</span>
            )}

            {config.table !== '*' ? (
              <>
                <span> and </span>
                <Badge className="!bg-brand-400 !text-brand-600">table: {config.table}</Badge>
              </>
            ) : null}
          </Button>
        </PopoverTrigger_Shadcn_>
        <PopoverContent_Shadcn_ className="p-0 w-full" align="start">
          <div className="border-b border-overlay text-xs px-4 py-3 text-foreground">
            Filter incoming messages
          </div>
          <div className="flex border-b border-overlay p-4 gap-y-2 flex-col">
            <FilterSchema
              value={tempConfig.schema}
              onChange={(v) => setTempConfig({ ...tempConfig, schema: v, table: '*' })}
            />

            <TableSchema
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
          <div className="px-4 py-2 gap-2 flex justify-end">
            <Button type="default" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setApplyConfigOpen(true)}>Apply</Button>
          </div>
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>
      <ApplyConfigModal
        visible={applyConfigOpen}
        onSelectCancel={() => setApplyConfigOpen(false)}
        onSelectConfirm={() => {
          onChangeConfig(tempConfig)
          setApplyConfigOpen(false)
          setOpen(false)
        }}
      />
    </>
  )
}
