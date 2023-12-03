import { FormEvent, useState } from 'react'
import { IconGlobe, IconSearch, Listbox } from 'ui'

import { ALL_TIMEZONES } from './PITR.constants'

interface TimezoneSelectionProps {
  hideLabel?: boolean
  dropdownWidth?: string
  selectedTimezone: any
  onSelectTimezone: (timezone: any) => void
}

const TimezoneSelection = ({
  hideLabel,
  dropdownWidth,
  selectedTimezone,
  onSelectTimezone,
}: TimezoneSelectionProps) => {
  const [searchString, setSearchString] = useState<string>('')

  const timezoneOptions =
    searchString.length > 0
      ? ALL_TIMEZONES.map((option) => option.text).filter((option) =>
          option.toLowerCase().includes(searchString.toLowerCase())
        )
      : ALL_TIMEZONES.map((option) => option.text)

  return (
    <div className="flex justify-between space-x-8">
      {!hideLabel && <p className="w-2/5 text-sm">Select timezone</p>}
      <div className={`${hideLabel ? 'w-full' : 'w-3/5'}`}>
        <Listbox
          value={selectedTimezone.text}
          icon={<IconGlobe />}
          onChange={(text) => {
            const selectedTimezone = ALL_TIMEZONES.find((option) => option.text === text)
            onSelectTimezone(selectedTimezone)
          }}
          onBlur={() => setSearchString('')}
        >
          <div
            className={[
              'fixed top-0 flex w-full items-center',
              'rounded-t-md border-b border-overlay bg-surface-300',
              'mb-4 space-x-2 px-4 py-2',
            ].join(' ')}
            style={{ zIndex: 1 }}
          >
            <IconSearch size={14} />
            <input
              autoFocus
              className="placeholder-foreground-lighter w-72 bg-transparent text-sm outline-none"
              value={searchString}
              placeholder={''}
              onChange={(e: FormEvent<HTMLInputElement>) => setSearchString(e.currentTarget.value)}
            />
          </div>
          {/* Whitespace to shift listbox options down for searchfield */}
          <div className="h-8" />
          {timezoneOptions.map((option) => {
            return (
              <Listbox.Option key={option} label={option} value={option} className={dropdownWidth}>
                <div>{option}</div>
              </Listbox.Option>
            )
          })}
          {timezoneOptions.length === 0 && (
            <Listbox.Option disabled key="no-results" label="" value="">
              No timezones found
            </Listbox.Option>
          )}
        </Listbox>
      </div>
    </div>
  )
}

export default TimezoneSelection
