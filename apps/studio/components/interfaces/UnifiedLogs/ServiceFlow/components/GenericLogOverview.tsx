import {
  ActivityIcon,
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  BracesIcon,
  DatabaseIcon,
  FileTextIcon,
  GlobeIcon,
  ListIcon,
  ScrollTextIcon,
  ShieldCheckIcon,
  type LucideIcon,
} from 'lucide-react'

import { LogFieldRow } from '../../components/LogFieldRow'
import { LogFields } from '../../components/LogFields'
import type { ColumnSchema } from '../../UnifiedLogs.schema'
import { getEventMessageDisplay } from '../../UnifiedLogs.utils'
import type { BlockFieldConfig, ServiceFlowBlockProps } from '../types'
import { groupLogAttributes, type AttributeSectionId } from '../utils/attributeSections'
import { DetailRow } from './shared/DetailRow'
import { CollapsibleDetailSection } from '@/components/ui/DataTable/CollapsibleDetailSection'

const SECTION_ICONS: Record<AttributeSectionId, LucideIcon> = {
  details: FileTextIcon,
  request: ArrowUpRightIcon,
  response: ArrowDownLeftIcon,
  auth: ShieldCheckIcon,
  client: GlobeIcon,
  postgres: DatabaseIcon,
  event: ActivityIcon,
  'request-headers': ListIcon,
  'response-headers': ListIcon,
  other: BracesIcon,
}

const LOG_FIELDS: BlockFieldConfig[] = [
  {
    id: 'event_message',
    label: 'Message',
    getValue: (data) => getEventMessageDisplay(data.log_type, data.event_message).message,
    wrap: true,
  },
  { id: 'level', label: 'Level', getValue: (data) => data.level },
  { id: 'pipeline_id', label: 'Pipeline ID', getValue: (data) => data.pipeline_id },
  { id: 'status', label: 'Status', getValue: (data) => data.status },
  { id: 'method', label: 'Method', getValue: (data) => data.method },
  { id: 'pathname', label: 'Path', getValue: (data) => data.pathname },
  { id: 'auth_user', label: 'User', getValue: (data) => data.auth_user },
]

type GenericLogOverviewProps = Pick<ServiceFlowBlockProps, 'filterFields' | 'table'> & {
  data: ColumnSchema
  attributes?: ColumnSchema['metadata']
}

export function GenericLogOverview({
  data,
  attributes,
  filterFields,
  table,
}: GenericLogOverviewProps) {
  const logFields = LOG_FIELDS.map((config) => ({ config, value: config.getValue(data) })).filter(
    ({ value }) => value !== null && value !== undefined && value !== ''
  )

  return (
    <>
      <CollapsibleDetailSection defaultOpen className="border-b" title="Log" icon={ScrollTextIcon}>
        {logFields.map(({ config, value }) => (
          <DetailRow
            key={config.id}
            config={config}
            level={data.level}
            value={value}
            filterFields={filterFields}
            table={table}
          />
        ))}
      </CollapsibleDetailSection>
      {groupLogAttributes(attributes ?? {}).map((section) => (
        <CollapsibleDetailSection
          key={section.id}
          className="border-b"
          title={section.title}
          icon={SECTION_ICONS[section.id]}
        >
          {section.fields.map(({ key, label, value }) => (
            <LogFieldRow
              key={key}
              label={label}
              value={typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
              filterFields={filterFields}
              table={table}
              className="pl-9.5"
            >
              <LogFields data={value} />
            </LogFieldRow>
          ))}
        </CollapsibleDetailSection>
      ))}
    </>
  )
}
