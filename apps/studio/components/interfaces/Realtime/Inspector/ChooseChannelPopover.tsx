import { zodResolver } from '@hookform/resolvers/zod'
import { IS_PLATFORM } from 'common'
import { ChevronDown } from 'lucide-react'
import { Dispatch, SetStateAction, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Switch,
} from 'ui'
import * as z from 'zod'

import { RealtimeConfig } from './useRealtimeMessages'
import { DocsButton } from '@/components/ui/DocsButton'
import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'
import { getTemporaryAPIKey } from '@/data/api-keys/temp-api-keys-query'
import { DOCS_URL } from '@/lib/constants'
import { useTrack } from '@/lib/telemetry/track'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

type ControlledOpenProps =
  | { open: boolean; onOpenChange: (open: boolean) => void }
  | { open?: undefined; onOpenChange?: undefined }

type ChooseChannelPopoverProps = {
  config: RealtimeConfig
  onChangeConfig: Dispatch<SetStateAction<RealtimeConfig>>
} & ControlledOpenProps

const FormSchema = z.object({ channel: z.string(), isPrivate: z.boolean() })

export const ChooseChannelPopover = ({
  config,
  onChangeConfig,
  open: controlledOpen,
  onOpenChange,
}: ChooseChannelPopoverProps) => {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  const setOpen = (v: boolean) => {
    if (isControlled) {
      onOpenChange?.(v)
    } else {
      setInternalOpen(v)
    }
  }
  const track = useTrack()

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

  const onSubmit = async () => {
    setOpen(false)
    track('realtime_inspector_listen_channel_clicked')

    let token = config.token

    // [Joshen] Refresh if starting to listen + using temp API key, since it has a low refresh rate
    if (token.startsWith('sb_temp') || !IS_PLATFORM) {
      const data = await getTemporaryAPIKey({ projectRef: config.projectRef, expiry: 3600 })
      token = data.api_key
    }
    onChangeConfig({
      ...config,
      token,
      channelName: form.getValues('channel'),
      isChannelPrivate: form.getValues('isPrivate'),
      enabled: true,
    })
  }

  const channelPopoverTrigger = (
    <PopoverTrigger asChild>
      <Button className="rounded-r-none" type="default" size="tiny" iconRight={<ChevronDown />}>
        <p
          className="max-w-[120px] truncate"
          title={config.channelName.length > 0 ? config.channelName : ''}
        >
          {config.channelName.length > 0 ? `Channel: ${config.channelName}` : 'Join a channel'}
        </p>
      </Button>
    </PopoverTrigger>
  )

  return (
    <Popover open={open} onOpenChange={onOpen}>
      {!open && config.channelName.length === 0 ? (
        <ShortcutTooltip shortcutId={SHORTCUT_IDS.INSPECTOR_JOIN_CHANNEL} side="bottom">
          {channelPopoverTrigger}
        </ShortcutTooltip>
      ) : (
        channelPopoverTrigger
      )}
      <PopoverContent className="p-0 w-[320px]" align="start">
        <div className="p-4 flex flex-col text-sm">
          {config.channelName.length === 0 ? (
            <>
              <Form {...form}>
                <form
                  id="realtime-channel"
                  onSubmit={form.handleSubmit(() => onSubmit())}
                  className="flex flex-col gap-y-4"
                >
                  <FormField
                    name="channel"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-y-2">
                        <div className="flex flex-col gap-y-1">
                          <label className="text-foreground text-xs">Name of channel</label>
                          <InputGroup>
                            <FormControl>
                              <InputGroupInput
                                {...field}
                                autoComplete="off"
                                className="rounded-r-none text-xs px-2.5 py-1 h-auto"
                                placeholder="Enter a channel name"
                              />
                            </FormControl>
                            <InputGroupAddon align="inline-end">
                              <InputGroupButton
                                type="primary"
                                disabled={form.getValues().channel.length === 0}
                                onClick={() => onSubmit()}
                              >
                                Listen to channel
                              </InputGroupButton>
                            </InputGroupAddon>
                          </InputGroup>
                        </div>
                        <FormDescription className="text-xs text-foreground-lighter">
                          The channel you initialize with the Supabase Realtime client. Learn more
                          in{' '}
                          <a
                            target="_blank"
                            rel="noreferrer"
                            className="underline hover:text-foreground transition"
                            href={`${DOCS_URL}/guides/realtime/concepts#channels`}
                          >
                            our docs
                          </a>
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    key="isPrivate"
                    control={form.control}
                    name="isPrivate"
                    render={({ field }) => (
                      <FormItem className="">
                        <div className="flex flex-row items-center gap-x-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={field.disabled}
                            />
                          </FormControl>
                          <FormLabel className="text-xs">Is channel private?</FormLabel>
                        </div>
                        <FormDescription className="text-xs text-foreground-lighter mt-2">
                          If the channel is marked as private, it will use RLS policies to filter
                          messages.
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <DocsButton
                    abbrev={false}
                    className="w-min"
                    href={`${DOCS_URL}/guides/realtime/authorization`}
                  />
                </form>
              </Form>
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
      </PopoverContent>
    </Popover>
  )
}
