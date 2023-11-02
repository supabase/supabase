import { PlusCircle } from 'lucide-react'
import { Dispatch, SetStateAction, useState } from 'react'
import {
  Badge,
  Button,
  Input,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'

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

  return (
    <>
      <Popover_Shadcn_ open={open} onOpenChange={onOpen}>
        <PopoverTrigger_Shadcn_ asChild>
          <Button
            icon={<PlusCircle size="16" />}
            type="primary"
            className="rounded-full !bg-brand-400 !border-brand-500 !text-brand-600 px-1.5 pr-0.5 !py-0.5"
            size="tiny"
          >
            <span className="text-brand-600 mr-1">Filtered by </span>
            <Badge className="!bg-brand-600 !text-brand-200 !px-1.5">schema: {config.schema}</Badge>
            {config.table !== '*' ? (
              <>
                <span className="text-brand-600"> and </span>
                <Badge className="!bg-brand-600 !text-brand-200">table: {config.table}</Badge>
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
          <div className="border-b border-overlay p-4">
            <div className="flex flex-row gap-4">
              <p className="w-[60px] flex justify-end text-sm">AND</p>
              <Input
                size="small"
                className="flex-grow"
                placeholder="body=eq.hey"
                value={tempConfig.filter}
                onChange={(v) => setTempConfig({ ...tempConfig, filter: v.target.value })}
              />
            </div>
          </div>
          <div className="px-4 py-2 gap-2 flex justify-end">
            <Button type="default" onClick={() => setOpen(false)}>
              <span>Cancel</span>
            </Button>
            <Button onClick={() => setApplyConfigOpen(true)}>
              <span>Apply</span>
            </Button>
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
