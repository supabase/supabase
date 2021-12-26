import { FC } from 'react'
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
} from '@supabase/ui'
import { LogTemplate } from '.'

interface Props {
  searchValue?: string
  templates?: any
  isLoading: boolean
  isCustomQuery: boolean
  newCount: number
  showReset: boolean
  onReset: () => void
  onRefresh?: () => void
  onSearch?: (query: string) => void
  onCustomClick?: () => void
  onSelectTemplate: (template: LogTemplate) => void
}

/**
 * Logs control panel header + wrapper
 */
const LogPanel: FC<Props> = ({
  searchValue,
  templates = [],
  isLoading,
  isCustomQuery,
  newCount,
  showReset,
  onReset,
  onRefresh,
  onSearch = () => {},
  onCustomClick,
  onSelectTemplate,
}) => {
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
          <Input
            size="tiny"
            icon={<IconSearch size={16} />}
            placeholder="Search event messages"
            onChange={(e) => onSearch(e.target.value)}
            value={searchValue}
            actions={
              showReset && <IconX size="tiny" className="cursor-pointer mx-1" title="Clear search" onClick={onReset} />
            }
          />
        </div>
      </div>
    </div>
  )
}

export default LogPanel
