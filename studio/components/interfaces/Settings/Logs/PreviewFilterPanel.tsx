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
  IconLink,
  IconExternalLink,
  IconCalendar,
  IconEye,
  Checkbox,
  Form,
} from '@supabase/ui'
import { LogSearchCallback, LogTemplate } from '.'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { FILTER_OPTIONS, LogsTableName } from './Logs.constants'
import { LogsFilter } from './Logs.filter'
import { DatePicker } from 'components/ui/DatePicker'
interface Props {
  defaultSearchValue?: string
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
  dispatchWhereFilters: (x: any) => void
  whereFilters: any
  table: LogsTableName
}

dayjs.extend(utc)

/**
 * Logs control panel header + wrapper
 */
const PreviewFilterPanel: FC<Props> = ({
  templates = [],
  isLoading,
  isCustomQuery,
  newCount,
  onRefresh,
  onSearch = () => {},
  defaultSearchValue = '',
  defaultToValue = '',
  onCustomClick,
  onSelectTemplate,
  isShowingEventChart,
  onToggleEventChart,
  dispatchWhereFilters,
  whereFilters: filters,
  table,
}) => {
  const [search, setSearch] = useState('')

  const [to, setTo] = useState({ value: '', error: '' })
  const [from, setFrom] = useState({ value: '', error: '' })
  const [defaultTimestamp, setDefaultTimestamp] = useState(dayjs().utc().toISOString())

  const [localSearchValue, setlocalSearchValue] = useState(search)

  const hasEdits = localSearchValue !== search

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
  }, [defaultToValue])

  const handleFromReset = async () => {
    setTo({ value: '', error: '' })
    const value = dayjs().utc().toISOString()
    setDefaultTimestamp(value)
    onSearch({ query: search, to: '' })
  }

  //   const handleSearch = () => onSearch({ query: search, to: to.value })

  // const handleSearch = (value: string) =>
  //   onSearch({
  //     query: value,
  //     to: to.value,
  //     // , from: from.value
  //   })

  const RefreshButton = () => {
    return !isCustomQuery ? (
      <Button
        type="default"
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
            <IconRefreshCw size={10} />
          </div>
        }
        loading={isLoading}
        onClick={onRefresh}
      >
        Refresh
      </Button>
    ) : null
  }

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

  const showReset = to.value !== '' || from.value !== ''

  const showFromReset = to.value !== ''

  const handleSearch = () => onSearch({ query: search, to: to.value, from: from.value })

  // console.log('this is what is going through', FILTER_OPTIONS[table])

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex flex-row gap-4 items-center">
        <form
          id="log-panel-search"
          onSubmit={(e) => {
            // prevent redirection
            e.preventDefault()
            setSearch(localSearchValue)
            handleSearch(localSearchValue)
          }}
        >
          <Input
            className="w-60"
            size="tiny"
            placeholder="Search events"
            onChange={(e) => setlocalSearchValue(e.target.value)}
            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
              setSearch(e.target.value)
              handleSearch(localSearchValue)
            }}
            icon={
              <div className="text-scale-900">
                <IconSearch size={14} />
              </div>
            }
            value={localSearchValue}
            actions={
              hasEdits && (
                <button
                  onClick={() => handleSearch(localSearchValue)}
                  className="text-scale-1100 hover:text-scale-1200 mx-2"
                >
                  {'↲'}
                </button>
              )
            }
          />
        </form>

        <div className="flex items-center">
          <Dropdown
            size="small"
            side="bottom"
            align="start"
            overlay={
              <>
                <Dropdown.RadioGroup onChange={(e) => console.log(e)} value={'1_hour'}>
                  <Dropdown.Radio value="1_hour">1 hour</Dropdown.Radio>
                  <Dropdown.Radio value="3_hour">Last 3 hour</Dropdown.Radio>
                  <Dropdown.Radio value="1_day">Last day</Dropdown.Radio>
                </Dropdown.RadioGroup>
              </>
            }
          >
            <Button
              as="span"
              type="default"
              icon={<IconClock size={12} />}
              // style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
            >
              Last hour
            </Button>
          </Dropdown>
          {/* <Button
            type="default"
            style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
            icon={<IconCalendar size={12} />}
          >
            Custom
          </Button> */}
          <DatePicker />
        </div>

        <div>
          <RefreshButton />
        </div>

        <div className="flex items-center gap-2">
          {Object.values(FILTER_OPTIONS[table]).map((x) => {
            // console.log('filter option', x)
            return (
              <LogsFilter
                key={`${x.key}-filter`}
                options={x}
                dispatchFilters={dispatchWhereFilters}
                filtersState={filters}
              />
            )
          })}
        </div>

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
                  <Button key="set" size="tiny" title="Set" type="secondary" onClick={handleSearch}>
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
        {/* {!isCustomQuery && (
          <div className="flex items-center space-x-2">
            <p className="text-xs">Show event chart</p>
            <Toggle size="tiny" checked={isShowingEventChart} onChange={onToggleEventChart} />
          </div>
        )} */}

        {!isCustomQuery && (
          <>
            <div className="flex flex-row gap-2">
              {/* <Popover
                side="bottom"
                align="end"
                portalled
                overlay={
                  <Input
                    label="To"
                    labelOptional="UTC"
                    value={to.value === '' ? defaultTimestamp : to.value}
                    onChange={handleFromChange}
                    error={to.error}
                    className="w-72 p-3"
                    actions={[
                      <Button
                        key="set"
                        size="tiny"
                        title="Set"
                        type="secondary"
                        onClick={() => handleSearch(localSearchValue)}
                      >
                        Set
                      </Button>,
                    ]}
                  />
                }
              >
                <Button
                  as="span"
                  size="tiny"
                  className={showFromReset ? '!rounded-r-none' : ''}
                  type={showFromReset ? 'default' : 'secondary'}
                  icon={<IconClock size="tiny" />}
                >
                  {to.value ? 'Custom' : 'Now'}
                </Button>
              </Popover> */}

              {/* Clear the filters could be here */}
            </div>
            {/* {showFromReset && ( */}
            {/* <Button
              size="tiny"
              className={showFromReset ? '!rounded-l-none' : ''}
              type="warning"
              title="Clear timestamp filter"
              onClick={handleFromReset}
            >
              Clear filter
            </Button> */}
            {/* )} */}
            {/* {!isCustomQuery && (
              <>
                <div className="flex items-center space-x-2">
                  <p className="text-xs">Show event chart</p>
                  <Toggle size="tiny" checked={isShowingEventChart} onChange={onToggleEventChart} />
                </div>
                <Button type="default" icon={<IconEye size={12} />}>
                  Show Histogram
                </Button>
              </>
            )} */}
            {/* wrap with form so that if user presses enter, the search value will submit automatically */}
          </>
        )}
      </div>
      <Button type="secondary" onClick={onCustomClick} iconRight={<IconExternalLink size={10} />}>
        Explore via query
      </Button>
    </div>
  )
}

export default PreviewFilterPanel
