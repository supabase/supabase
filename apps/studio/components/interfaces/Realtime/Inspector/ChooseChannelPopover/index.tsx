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
  IconChevronDown,
  Input_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
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
    onChangeConfig({ ...config, channelName: form.getValues('channel'), enabled: true })
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
            {config.channelName.length > 0 ? `Channel: ${config.channelName}` : 'Join a channel'}
          </p>
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0 w-[320px]" align="start">
        <div className="p-4 flex flex-col text-sm">
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
                            type="primary"
                            className="rounded-l-none"
                            disabled={form.getValues().channel.length === 0}
                            onClick={() => onSubmit()}
                          >
                            Listen to channel
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
                <p className="text-foreground text-xs">Currently joined channel:</p>
                <p className="text-xs border border-scale-600  py-0.5 px-1 rounded-md bg-surface-200">
                  {config.channelName}
                </p>
              </div>
              <p className="text-xs text-foreground-lighter mt-2">
                If you leave this channel, all of the messages populated on this page will disappear
              </p>
              <Button
                type="default"
                onClick={() => onChangeConfig({ ...config, channelName: '', enabled: false })}
              >
                Leave channel
              </Button>
            </div>
          )}
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
