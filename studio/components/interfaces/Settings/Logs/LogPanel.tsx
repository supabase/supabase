import React, { FC, SyntheticEvent, useEffect, useMemo, useState } from 'react'
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
} from '@supabase/ui'
import { LogTemplate } from '.'
import { isNull } from 'lodash'
import dayjs from 'dayjs'
interface Props {
  defaultSearchValue?: string
  templates?: any
  isLoading: boolean
  isCustomQuery: boolean
  newCount: number
  onRefresh?: () => void
  onSearch?: (query: string) => void
  onCustomClick?: () => void
  onSelectTemplate: (template: LogTemplate) => void
}

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
  onCustomClick,
  onSelectTemplate,
}) => {
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState({ value: '', error: '' })
  const [defaultTimestamp, setDefaultTimestamp] = useState(dayjs().toISOString())
  // sync local state with provided default value
  useEffect(() => {
    if (search !== defaultSearchValue) {
      setSearch(defaultSearchValue)
    }
  }, [defaultSearchValue])

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let error = ''
    const value = e.target.value
    //   // try to parse the iso value
    //   if (isNaN(Date.parse(value)))
    setFrom({ value, error })
  }
  const handleFromReset = () => {
    const value = dayjs().toISOString()
    setFrom({ value, error: '' })
    setDefaultTimestamp(value)
  }
  return (
    <div className="bg-panel-header-light dark:bg-panel-header-dark">
      <div className="px-2 py-1 flex items-center justify-between w-full">
        <div className="flex flex-row gap-x-4 items-center">
          <Button
            type="text"
            icon={
              <div className="relative">
                {newCount > 0 && (
                  <div
                    className={[
                      'absolute flex items-center justify-center -top-0.5 -right-0.5',
                      'h-3 w-3 z-50',
                    ].join(' ')}
                  >
                    <div className="absolute ">
                      <Typography.Text style={{ fontSize: '0.5rem' }}>{newCount}</Typography.Text>
                    </div>
                    <div className="bg-green-500 rounded-full w-full h-full"></div>
                    <div className="absolute top-0 right-0 bg-green-500 rounded-full w-full h-full animate-ping"></div>
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
          <Dropdown
            side="bottom"
            align="start"
            overlay={templates.map((template: LogTemplate) => (
              <Dropdown.Item key={template.label} onClick={() => onSelectTemplate(template)}>
                <Typography.Text>{template.label}</Typography.Text>
              </Dropdown.Item>
            ))}
          >
            <Button type="text" iconRight={<IconChevronDown />}>
              Templates
            </Button>
          </Dropdown>

          <div className="flex items-center space-x-2">
            <Typography.Text type="secondary" small>
              Search logs via query
            </Typography.Text>
            <Toggle size="tiny" checked={isCustomQuery} onChange={onCustomClick} />
          </div>
        </div>
        <div className="flex items-center gap-x-4">
          <div>
            <Dropdown
              side="bottom"
              align="end"
              overlay={
                <Dropdown.Misc>
                  <Input
                    label="From"
                    labelOptional="UTC"
                    size="tiny"
                    value={from.value === '' ? defaultTimestamp : from.value}
                    onChange={handleFromChange}
                    actions={[
                      search && (
                        <IconX
                          key="reset-from"
                          size="tiny"
                          className="cursor-pointer mx-1"
                          title="Reset input"
                          onClick={handleFromReset}
                        />
                      ),
                      <Button
                        key="set"
                        size="tiny"
                        title="Set"
                        type="secondary"
                        onClick={() => onSearch(search)}
                      >
                        Set
                      </Button>,
                    ]}
                  />
                </Dropdown.Misc>
              }
            >
              <Button type="outline" icon={<IconClock size="tiny" />}>
                {from.value ? 'Custom' : 'Now'}
              </Button>
            </Dropdown>
          </div>
          {/* wrap with form so that if user presses enter, the search value will submit automatically */}
          <form
            id="log-panel-search"
            onSubmit={(e) => {
              // prevent redirection
              e.preventDefault()
              onSearch(search)
            }}
          >
            <Input
              size="tiny"
              icon={<IconSearch size={16} />}
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
                <Button
                  key="go"
                  size="tiny"
                  title="Go"
                  type="secondary"
                  onClick={() => onSearch(search)}
                >
                  Go
                </Button>,
              ]}
            />
          </form>
        </div>
      </div>
    </div>
  )
}

export default LogPanel
