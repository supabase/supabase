import { Dispatch, SetStateAction, useState } from 'react'
import {
  Button,
  IconBroadcast,
  IconChevronDown,
  IconDatabaseChanges,
  IconPresence,
  Input,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  Toggle,
} from 'ui'

import { RealtimeConfig } from '../useRealtimeEvents'

interface ChooseChannelPopoverProps {
  config: RealtimeConfig
  onChangeConfig: Dispatch<SetStateAction<RealtimeConfig>>
}

export const ChooseChannelPopover = ({ config, onChangeConfig }: ChooseChannelPopoverProps) => {
  const [open, setOpen] = useState(false)
  const [channelName, setChannelName] = useState(config.channelName)

  const onOpen = (v: boolean) => {
    // when opening, copy the outside config into the intermediate one
    if (v === true) {
      setChannelName(config.channelName)
    }
    setOpen(v)
  }

  return (
    <Popover_Shadcn_ open={open} onOpenChange={onOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          className="rounded-r-none border-r-0"
          type="default"
          size="tiny"
          iconRight={<IconChevronDown />}
        >
          <span>Choose Channel</span>
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0" align="start">
        <div className="border-b border-overlay p-4 flex flex-col text-sm">
          <p>Channel for listening</p>
          <div className="flex flex-row">
            <Input
              size="tiny"
              className="w-full"
              inputClassName="rounded-r-none"
              value={channelName}
              onChange={(e) => {
                setChannelName(e.target.value)
              }}
            />
            <Button
              type="primary"
              className="rounded-l-none"
              onClick={() => onChangeConfig({ ...config, channelName })}
            >
              Apply
            </Button>
          </div>
        </div>
        <div className="border-b border-overlay p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2.5 items-center">
              <IconPresence size="xlarge" className="bg-brand-400 rounded" />
              <label htmlFor="toggle-presence" className="text-sm">
                Presence
              </label>
            </div>
            <Toggle
              id="toggle-presence"
              size="tiny"
              checked={config.enablePresence}
              onChange={() => onChangeConfig({ ...config, enablePresence: !config.enablePresence })}
            />
          </div>
          <p className="text-xs text-foreground-light pt-1">
            Store and synchronize online user state consistently across clients.
          </p>
        </div>
        <div className="border-b border-overlay p-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2.5 items-center">
              <IconBroadcast size="xlarge" className="bg-brand-400 rounded" />
              <label htmlFor="toggle-broadcast" className="text-sm">
                Broadcast
              </label>
            </div>
            <Toggle
              id="toggle-broadcast"
              size="tiny"
              checked={config.enableBroadcast}
              onChange={() =>
                onChangeConfig({ ...config, enableBroadcast: !config.enableBroadcast })
              }
            />
          </div>
          <p className="text-xs  text-foreground-light pt-1">
            Send any data to any client subscribed to the same Channel.
          </p>
        </div>
        <div className="border-b border-overlay p-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2.5 items-center">
              <IconDatabaseChanges size="xlarge" className="bg-brand-400 rounded" />
              <label htmlFor="toggle-db-changes" className="text-sm">
                Database changes
              </label>
            </div>
            <Toggle
              id="toggle-db-changes"
              size="tiny"
              checked={config.enableDbChanges}
              onChange={() =>
                onChangeConfig({ ...config, enableDbChanges: !config.enableDbChanges })
              }
            />
          </div>
          <p className="text-xs text-foreground-light pt-1">
            Listen to changes in the Database inserts, updates, and deletes and other changes.
          </p>
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
