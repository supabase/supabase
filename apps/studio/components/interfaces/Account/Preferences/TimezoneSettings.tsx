import { CheckIcon, GlobeIcon } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import {
  Card,
  CardContent,
  cn,
  ComboboxTrigger,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import {
  getTimezoneLabel,
  getTimezoneLabelByIana,
  TIMEZONES_BY_IANA,
} from '@/lib/constants/timezones'
import { useTimezone } from '@/lib/datetime'
import { guessLocalTimezone } from '@/lib/dayjs'
import { useTranslation } from '@/lib/i18n/LocaleProvider'
import { resolveMessage } from '@/lib/i18n/translate'
import { TranslatedText } from '@/lib/i18n/TranslatedText'
import { useTrack } from '@/lib/telemetry/track'

const AUTO_OPTION_VALUE = '__auto__'

export const TimezoneSettings = () => {
  const track = useTrack()
  const { locale } = useTranslation()
  const listboxId = useId()
  const [open, setOpen] = useState(false)
  const { timezone, storedTimezone, setTimezone, isAutoDetected } = useTimezone()

  // Browser timezone is captured once and stays stable even when the user has
  // overridden the dashboard timezone — that's the value the "Auto detect"
  // option will revert to.
  const browserTimezone = useMemo(() => guessLocalTimezone(), [])

  const triggerLabel = useMemo(() => getTimezoneLabelByIana(timezone), [timezone])
  const label = resolveMessage(locale, 'account.preferences.timezone.label')
  const autoDetect = resolveMessage(locale, 'account.preferences.timezone.autoDetect')
  const autoDetectWithZone = resolveMessage(
    locale,
    'account.preferences.timezone.autoDetectWithZone',
    {
      timezone,
    }
  )
  const searchPlaceholder = resolveMessage(locale, 'account.preferences.timezone.searchPlaceholder')

  const handleSelect = (nextStored: string) => {
    setTimezone(nextStored)
    const resolvedNext = nextStored || guessLocalTimezone()
    track('timezone_picker_clicked', {
      previousTimezone: timezone,
      nextTimezone: resolvedNext,
      isAutoDetected: nextStored === '',
      source: 'account_preferences',
    })
    setOpen(false)
  }

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>
            <TranslatedText messageKey="account.preferences.timezone.title" />
          </PageSectionTitle>
          <PageSectionDescription>
            <TranslatedText messageKey="account.preferences.timezone.description" />
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <Card>
          <CardContent>
            <FormItemLayout
              isReactForm={false}
              label={<span lang={label.lang}>{label.text}</span>}
              layout="flex-row-reverse"
              description={
                isAutoDetected ? (
                  <TranslatedText
                    messageKey="account.preferences.timezone.descriptionAuto"
                    params={{ timezone: browserTimezone }}
                  />
                ) : (
                  <TranslatedText messageKey="account.preferences.timezone.descriptionManual" />
                )
              }
            >
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <ComboboxTrigger
                    aria-label={label.text}
                    lang={label.lang}
                    aria-expanded={open}
                    aria-controls={listboxId}
                    data-state={open ? 'open' : 'closed'}
                    size="small"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <GlobeIcon aria-hidden="true" className="h-4 w-4 shrink-0" />
                      <span
                        className="truncate"
                        lang={isAutoDetected ? autoDetectWithZone.lang : 'en'}
                      >
                        {isAutoDetected ? autoDetectWithZone.text : triggerLabel}
                      </span>
                    </span>
                  </ComboboxTrigger>
                </PopoverTrigger>
                <PopoverContent id={listboxId} className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput
                      placeholder={searchPlaceholder.text}
                      lang={searchPlaceholder.lang}
                      className="h-9"
                    />
                    <CommandList>
                      <CommandEmpty>
                        <TranslatedText messageKey="account.preferences.timezone.empty" />
                      </CommandEmpty>
                      <CommandGroup>
                        <ScrollArea className="h-72">
                          <CommandItem
                            key={AUTO_OPTION_VALUE}
                            lang={autoDetect.lang}
                            value={`${autoDetect.text} ${browserTimezone}`}
                            onSelect={() => handleSelect('')}
                          >
                            <div className="flex flex-col">
                              <span>{autoDetect.text}</span>
                              <span lang="en" className="text-xs text-foreground-lighter">
                                {browserTimezone}
                              </span>
                            </div>
                            <CheckIcon
                              className={cn(
                                'ml-auto h-4 w-4',
                                isAutoDetected ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                          </CommandItem>
                          {TIMEZONES_BY_IANA.map((entry) => {
                            const ianaName = entry.utc[0]
                            const isSelected = !isAutoDetected && storedTimezone === ianaName
                            return (
                              <CommandItem
                                key={ianaName}
                                lang="en"
                                // CommandItem matches against the `value` prop for the input filter — include
                                // both the human label and the IANA name so search works for either.
                                value={`${getTimezoneLabel(entry)} ${ianaName}`}
                                onSelect={() => handleSelect(ianaName)}
                              >
                                {getTimezoneLabel(entry)}
                                <CheckIcon
                                  className={cn(
                                    'ml-auto h-4 w-4',
                                    isSelected ? 'opacity-100' : 'opacity-0'
                                  )}
                                />
                              </CommandItem>
                            )
                          })}
                        </ScrollArea>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </FormItemLayout>
          </CardContent>
        </Card>
      </PageSectionContent>
    </PageSection>
  )
}
