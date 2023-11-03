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

import Link from 'next/link'
import { RealtimeConfig } from '../useRealtimeMessages'

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
          className="rounded-r-none"
          type="default"
          size="tiny"
          iconRight={<IconChevronDown />}
        >
          <p
            className="max-w-[120px] truncate"
            title={config.channelName.length > 0 ? config.channelName : ''}
          >
            {config.channelName.length > 0 ? `Channel: ${config.channelName}` : 'Choose channel'}
          </p>
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0" align="start">
        <div className="border-b border-overlay p-4 flex flex-col text-sm">
          {config.channelName.length === 0 ? (
            <>
              <label className="text-foreground text-xs mb-2">Name of channel</label>
              <div className="flex flex-row">
                <Input
                  size="tiny"
                  className="w-full"
                  inputClassName="rounded-r-none"
                  placeholder="Enter a channel name"
                  value={channelName}
                  onChange={(e) => {
                    setChannelName(e.target.value)
                  }}
                />
                <Button
                  type="default"
                  className="rounded-l-none"
                  disabled={channelName.length === 0}
                  onClick={() => {
                    setOpen(false)
                    onChangeConfig({ ...config, channelName })
                  }}
                >
                  Set channel
                </Button>
              </div>
              <p className="text-xs text-foreground-lighter mt-2">
                The channel you initialize with the Supabase Realtime client. Learn more in{' '}
                <Link
                  href="https://supabase.com/docs/guides/realtime/concepts#channels"
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-foreground transition"
                >
                  our docs
                </Link>
              </p>
            </>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-x-2">
                <p className="text-foreground text-xs">Currently using channel</p>
                <p className="text-xs border border-scale-600  py-0.5 px-1 rounded-md bg-surface-200">
                  {config.channelName}
                </p>
              </div>
              <p className="text-xs text-foreground-lighter mt-2">
                If you unset this channel, all of the messages populated on this page will disappear
              </p>
              <Button
                type="default"
                onClick={() => onChangeConfig({ ...config, channelName: '', enabled: false })}
              >
                Unset channel
              </Button>
            </div>
          )}
        </div>
        <div className="border-b border-overlay p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2.5 items-center">
              <IconPresence size="xlarge" className="bg-brand-400 rounded text-brand-600" />
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
            Store and synchronize user state consistently across clients
          </p>
        </div>
        <div className="border-b border-overlay p-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2.5 items-center">
              <IconBroadcast size="xlarge" className="bg-brand-400 rounded text-brand-600" />
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
            Send any data to any client subscribed to the same channel
          </p>
        </div>
        <div className="border-b border-overlay p-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2.5 items-center">
              <IconDatabaseChanges size="xlarge" className="bg-brand-400 rounded text-brand-600" />
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
            Listen for Database inserts, updates, deletes and more
          </p>
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
