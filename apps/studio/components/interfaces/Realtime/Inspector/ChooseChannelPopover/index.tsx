import { zodResolver } from '@hookform/resolvers/zod'
import { useTelemetryProps } from 'common'
import { useRouter } from 'next/router'
import { Dispatch, SetStateAction, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { useFlag } from 'hooks/ui/useFlag'
import Telemetry from 'lib/telemetry'
import { ExternalLink } from 'lucide-react'
import {
  Button,
  FormControl_Shadcn_,
  FormDescription_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  Form_Shadcn_,
  IconChevronDown,
  Input_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  Switch,
} from 'ui'
import { RealtimeConfig } from '../useRealtimeMessages'

interface ChooseChannelPopoverProps {
  config: RealtimeConfig
  onChangeConfig: Dispatch<SetStateAction<RealtimeConfig>>
}

const FormSchema = z.object({ channel: z.string(), isPrivate: z.boolean() })

export const ChooseChannelPopover = ({ config, onChangeConfig }: ChooseChannelPopoverProps) => {
  const [open, setOpen] = useState(false)
  const telemetryProps = useTelemetryProps()
  const router = useRouter()
  const authzEnabled = useFlag('authzRealtime')

  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(FormSchema),
    defaultValues: { channel: '', isPrivate: false },
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
    Telemetry.sendEvent(
      {
        category: 'realtime_inspector',
        action: 'started_listening_to_channel_in_input_channel_popover',
        label: 'realtime_inspector_config',
      },
      telemetryProps,
      router
    )
    onChangeConfig({
      ...config,
      channelName: form.getValues('channel'),
      isChannelPrivate: form.getValues('isPrivate'),
      enabled: true,
    })
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
                <form
                  id="realtime-channel"
                  onSubmit={form.handleSubmit(() => onSubmit())}
                  className="flex flex-col gap-y-4"
                >
                  <FormField_Shadcn_
                    name="channel"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem_Shadcn_ className="flex flex-col gap-y-2">
                        <div className="flex flex-col gap-y-1">
                          <label className="text-foreground text-xs">Name of channel</label>
                          <div className="flex flex-row">
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
                        </div>
                        <FormDescription_Shadcn_ className="text-xs text-foreground-lighter">
                          The channel you initialize with the Supabase Realtime client. Learn more
                          in{' '}
                          <a
                            target="_blank"
                            rel="noreferrer"
                            className="underline hover:text-foreground transition"
                            href="https://supabase.com/docs/guides/realtime/concepts#channels"
                          >
                            our docs
                          </a>
                        </FormDescription_Shadcn_>
                      </FormItem_Shadcn_>
                    )}
                  />

                  {authzEnabled ? (
                    <FormField_Shadcn_
                      key="isPrivate"
                      control={form.control}
                      name="isPrivate"
                      render={({ field }) => (
                        <FormItem_Shadcn_ className="">
                          <div className="flex flex-row items-center gap-x-2">
                            <FormControl_Shadcn_>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={field.disabled}
                              />
                            </FormControl_Shadcn_>
                            <FormLabel_Shadcn_ className="text-xs">
                              Is channel private?
                            </FormLabel_Shadcn_>
                          </div>
                          <FormDescription_Shadcn_ className="text-xs text-foreground-lighter mt-2">
                            If the channel is marked as private, it will use RLS policies to filter
                            messages.
                          </FormDescription_Shadcn_>
                        </FormItem_Shadcn_>
                      )}
                    />
                  ) : null}

                  <Button asChild type="default" className="w-min" icon={<ExternalLink />}>
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href="https://supabase.com/docs/guides/realtime/authorization"
                    >
                      Documentation
                    </a>
                  </Button>
                </form>
              </Form_Shadcn_>
            </>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-x-2">
                <p className="text-foreground text-xs">
                  Currently joined{' '}
                  <span className={config.isChannelPrivate ? 'text-brand' : 'text-warning'}>
                    {config.isChannelPrivate ? 'private' : 'public'}
                  </span>{' '}
                  channel:
                </p>
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
