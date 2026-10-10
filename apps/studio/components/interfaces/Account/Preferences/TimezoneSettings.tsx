import { CheckIcon, Globe } from 'lucide-react'
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

import { findTimezoneByIana, TIMEZONES_BY_IANA } from '@/lib/constants/timezones'
import { useTimezone } from '@/lib/datetime'
import { guessLocalTimezone } from '@/lib/dayjs'
import { useTranslation } from '@/lib/i18n/LocaleProvider'
import { useTrack } from '@/lib/telemetry/track'

const AUTO_OPTION_VALUE = '__auto__'

export const TimezoneSettings = () => {
  const track = useTrack()
  const { t } = useTranslation()
  const listboxId = useId()
  const [open, setOpen] = useState(false)
  const { timezone, storedTimezone, setTimezone, isAutoDetected } = useTimezone()

  // Browser timezone is captured once and stays stable even when the user has
  // overridden the dashboard timezone — that's the value the "Auto detect"
  // option will revert to.
  const browserTimezone = useMemo(() => guessLocalTimezone(), [])

  const triggerLabel = useMemo(() => findTimezoneByIana(timezone)?.text ?? timezone, [timezone])

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
          <PageSectionTitle>{t('account.preferences.timezone.title')}</PageSectionTitle>
          <PageSectionDescription>
            {t('account.preferences.timezone.description')}
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <Card>
          <CardContent>
            <FormItemLayout
              isReactForm={false}
              label={t('account.preferences.timezone.label')}
              layout="flex-row-reverse"
              description={
                isAutoDetected
                  ? t('account.preferences.timezone.descriptionAuto', { timezone: browserTimezone })
                  : t('account.preferences.timezone.descriptionManual')
              }
            >
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <ComboboxTrigger
                    aria-expanded={open}
                    aria-controls={listboxId}
                    data-state={open ? 'open' : 'closed'}
                    size="small"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Globe aria-hidden="true" className="h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {isAutoDetected
                          ? t('account.preferences.timezone.autoDetectWithZone', { timezone })
                          : triggerLabel}
                      </span>
                    </span>
                  </ComboboxTrigger>
                </PopoverTrigger>
                <PopoverContent id={listboxId} className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput
                      placeholder={t('account.preferences.timezone.searchPlaceholder')}
                      className="h-9"
                    />
                    <CommandList>
                      <CommandEmpty>{t('account.preferences.timezone.empty')}</CommandEmpty>
                      <CommandGroup>
                        <ScrollArea className="h-72">
                          <CommandItem
                            key={AUTO_OPTION_VALUE}
                            value={`${t('account.preferences.timezone.autoDetect')} ${browserTimezone}`}
                            onSelect={() => handleSelect('')}
                          >
                            <div className="flex flex-col">
                              <span>{t('account.preferences.timezone.autoDetect')}</span>
                              <span className="text-xs text-foreground-lighter">
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
                                // CommandItem matches against the `value` prop for the input filter — include
                                // both the human label and the IANA name so search works for either.
                                value={`${entry.text} ${ianaName}`}
                                onSelect={() => handleSelect(ianaName)}
                              >
                                {entry.text}
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
