import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Dispatch, SetStateAction, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  Form_Shadcn_,
  IconBroadcast,
  IconChevronDown,
  IconDatabaseChanges,
  IconPresence,
  Input_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  Toggle,
} from 'ui'
import * as z from 'zod'

import { RealtimeConfig } from '../useRealtimeMessages'

interface ChooseChannelPopoverProps {
  config: RealtimeConfig
  onChangeConfig: Dispatch<SetStateAction<RealtimeConfig>>
}

export const ChooseChannelPopover = ({ config, onChangeConfig }: ChooseChannelPopoverProps) => {
  const [open, setOpen] = useState(false)

  const FormSchema = z.object({ channel: z.string() })
  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(FormSchema),
    defaultValues: { channel: '' },
  })

  const onOpen = (v: boolean) => {
    // when opening, copy the outside config into the intermediate one
    if (v === true) {
      form.setValue('channel', config.channelName)
    }
    setOpen(v)
  }

  const onSubmit = () => {
    setOpen(false)
    onChangeConfig({ ...config, channelName: form.getValues('channel') })
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
              <Form_Shadcn_ {...form}>
                <form id="realtime-channel" onSubmit={form.handleSubmit(() => onSubmit())}>
                  <FormField_Shadcn_
                    name="channel"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem_Shadcn_>
                        <label className="text-foreground text-xs mb-2">Name of channel</label>
                        <div className="flex">
                          <FormControl_Shadcn_>
                            <Input_Shadcn_
                              {...field}
                              autoComplete="off"
                              className="rounded-r-none text-xs px-2.5 py-1 h-auto"
                              placeholder="Enter a channel name"
                            />
                          </FormControl_Shadcn_>
                          <Button
                            type="default"
                            className="rounded-l-none"
                            disabled={form.getValues().channel.length === 0}
                            onClick={() => onSubmit()}
                          >
                            Set channel
                          </Button>
                        </div>
                      </FormItem_Shadcn_>
                    )}
                  />
                </form>
              </Form_Shadcn_>
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
