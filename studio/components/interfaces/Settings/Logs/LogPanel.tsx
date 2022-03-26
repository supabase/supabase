import React, { FC, useEffect, useState } from 'react'
import {
  Button,
  Input,
  Dropdown,
  Typography,
  IconChevronDown,
  IconRefreshCw,
  IconX,
  Toggle,
  IconSearch,
  IconClock,
  Popover,
} from '@supabase/ui'
import { LogSearchCallback, LogTemplate } from '.'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
interface Props {
  defaultSearchValue?: string
  defaultFromValue?: string
  defaultToValue?: string
  templates?: any
  isLoading: boolean
  isCustomQuery: boolean
  newCount: number
  onRefresh?: () => void
  onSearch?: LogSearchCallback
  onCustomClick?: () => void
  onSelectTemplate: (template: LogTemplate) => void
  isShowingEventChart: boolean
  onToggleEventChart: () => void
}

dayjs.extend(utc)

/**
 * Logs control panel header + wrapper
 */
const LogPanel: FC<Props> = ({
  templates = [],
  isLoading,
  isCustomQuery,
  newCount,
  onRefresh,
  onSearch = () => {},
  defaultSearchValue = '',
  defaultFromValue = '',
  defaultToValue = '',
  onCustomClick,
  onSelectTemplate,
  isShowingEventChart,
  onToggleEventChart,
}) => {
  const [search, setSearch] = useState('')
  const [to, setTo] = useState({ value: '', error: '' })
  const [from, setFrom] = useState({ value: '', error: '' })
  const [defaultTimestamp, setDefaultTimestamp] = useState(dayjs().utc().toISOString())

  // Sync local state with provided default value
  useEffect(() => {
    if (search !== defaultSearchValue) {
      setSearch(defaultSearchValue)
    }
  }, [defaultSearchValue])

  useEffect(() => {
    if (to.value !== defaultToValue) {
      setTo({ value: defaultToValue, error: '' })
    }
    if (from.value !== defaultFromValue) {
      setFrom({ value: defaultFromValue, error: '' })
    }
  }, [defaultToValue, defaultFromValue])

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value !== '' && isNaN(Date.parse(value))) {
      setTo({ value, error: 'Invalid ISO 8601 timestamp' })
    } else {
      setTo({ value, error: '' })
    }
  }

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value !== '' && isNaN(Date.parse(value))) {
      setFrom({ value, error: 'Invalid ISO 8601 timestamp' })
    } else {
      setFrom({ value, error: '' })
    }
  }
  const handleReset = async () => {
    setTo({ value: '', error: '' })
    setFrom({ value: '', error: '' })
    const value = dayjs().utc().toISOString()
    setDefaultTimestamp(value)
    onSearch({ query: search, to: '', from: '' })
  }

  const handleSearch = () => onSearch({ query: search, to: to.value, from: from.value })

  const showReset = to.value !== '' || from.value !== ''
  return (
    <div className="bg-panel-header-light dark:bg-panel-header-dark">
      <div className="px-2 py-1 flex items-center justify-between w-full">
        <div className="flex flex-row gap-x-4 items-center">
          {!isCustomQuery && (
            <Button
              type="text"
              icon={
                <div className="relative">
                  {newCount > 0 && (
                    <div
                      className={[
                        'absolute flex items-center justify-center -top-3 right-3',
                        'h-4 w-4 z-50',
                      ].join(' ')}
                    >
                      <div className="absolute z-20">
                        <Typography.Text style={{ fontSize: '0.6rem' }} className="opacity-80">
                          {newCount}
                        </Typography.Text>
                      </div>
                      <div className="bg-green-800 rounded-full w-full h-full animate-ping opacity-60"></div>
                      <div className="absolute z-60 top-0 right-0 bg-green-900 opacity-80 rounded-full w-full h-full"></div>
                    </div>
                  )}
                  <IconRefreshCw />
                </div>
              }
              loading={isLoading}
              onClick={onRefresh}
            >
              Refresh
            </Button>
          )}
          <Dropdown
            side="bottom"
            align="start"
            overlay={templates.map((template: LogTemplate) => (
              <Dropdown.Item key={template.label} onClick={() => onSelectTemplate(template)}>
                <Typography.Text>{template.label}</Typography.Text>
              </Dropdown.Item>
            ))}
          >
            <Button as="span" type="text" iconRight={<IconChevronDown />}>
              Templates
            </Button>
          </Dropdown>

          {!isCustomQuery && (
            <Button as="span" type="outline" onClick={onCustomClick}>
              Explore via query
            </Button>
          )}
        </div>
        <div className="flex items-center   gap-x-4">
          {!isCustomQuery && (
            <>
              <div className="flex flex-row">
                <Popover
                  side="bottom"
                  align="end"
                  portalled
                  overlay={
                    <>
                      <Input
                        label="From"
                        labelOptional="UTC"
                        value={from.value === '' ? defaultTimestamp : from.value}
                        onChange={handleFromChange}
                        error={from.error}
                        className="w-72 p-3"
                      />
                      <Input
                        label="To"
                        labelOptional="UTC"
                        value={to.value === '' ? defaultTimestamp : to.value}
                        onChange={handleToChange}
                        error={to.error}
                        className="w-72 p-3"
                      />
                      <div className="flex flex-row justify-end pb-2 px-4">
                        <Button
                          key="set"
                          size="tiny"
                          title="Set"
                          type="secondary"
                          onClick={handleSearch}
                        >
                          Set
                        </Button>
                      </div>
                    </>
                  }
                >
                  <Button
                    as="span"
                    size="tiny"
                    className={showReset ? '!rounded-r-none' : ''}
                    type={showReset ? 'outline' : 'text'}
                    icon={<IconClock size="tiny" />}
                  >
                    {to.value || from.value ? 'Custom' : 'Now'}
                  </Button>
                </Popover>
                {showReset && (
                  <Button
                    size="tiny"
                    className={showReset ? '!rounded-l-none' : ''}
                    icon={<IconX size="tiny" />}
                    type="outline"
                    title="Clear timestamp filter"
                    onClick={handleReset}
                  />
                )}
              </div>
              {!isCustomQuery && (
                <div className="flex items-center space-x-2">
                  <p className="text-xs">Show event chart</p>
                  <Toggle size="tiny" checked={isShowingEventChart} onChange={onToggleEventChart} />
                </div>
              )}
              {/* wrap with form so that if user presses enter, the search value will submit automatically */}
              <form
                id="log-panel-search"
                onSubmit={(e) => {
                  // prevent redirection
                  e.preventDefault()
                  handleSearch()
                }}
              >
                <Input
                  placeholder="Search events"
                  onChange={(e) => setSearch(e.target.value)}
                  value={search}
                  actions={[
                    search && (
                      <IconX
                        key="clear-search"
                        size="tiny"
                        className="cursor-pointer mx-1"
                        title="Clear search"
                        onClick={() => setSearch('')}
                      />
                    ),

                    <Button key="go" size="tiny" title="Go" type="default" onClick={handleSearch}>
                      <IconSearch size={16} />
                    </Button>,
                  ]}
                />
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default LogPanel
