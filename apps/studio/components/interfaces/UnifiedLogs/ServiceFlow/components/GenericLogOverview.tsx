import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Braces,
  Database,
  FileText,
  Globe,
  List,
  ScrollText,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'

import { LogFieldRow } from '../../components/LogFieldRow'
import { LogFields } from '../../components/LogFields'
import { getEventMessageDisplay } from '../../UnifiedLogs.utils'
import type { BlockFieldConfig, ServiceFlowBlockProps } from '../types'
import { groupLogAttributes, type AttributeSectionId } from '../utils/attributeSections'
import { DetailRow } from './shared/DetailRow'
import { CollapsibleDetailSection } from './shared/DetailSection'

const SECTION_ICONS: Record<AttributeSectionId, LucideIcon> = {
  details: FileText,
  request: ArrowUpRight,
  response: ArrowDownLeft,
  auth: ShieldCheck,
  client: Globe,
  postgres: Database,
  event: Activity,
  'request-headers': List,
  'response-headers': List,
  other: Braces,
}

// Fields every log has, whatever its source. Ids match the list's filter fields.
const LOG_FIELDS: BlockFieldConfig[] = [
  {
    id: 'event_message',
    label: 'Message',
    getValue: (data) => getEventMessageDisplay(data.log_type, data.event_message).message,
    wrap: true,
  },
  { id: 'level', label: 'Level', getValue: (data) => data.level },
  { id: 'status', label: 'Status', getValue: (data) => data.status },
  { id: 'method', label: 'Method', getValue: (data) => data.method },
  { id: 'pathname', label: 'Path', getValue: (data) => data.pathname },
  { id: 'auth_user', label: 'User', getValue: (data) => data.auth_user },
]

type GenericLogOverviewProps = Pick<ServiceFlowBlockProps, 'data' | 'filterFields' | 'table'> & {
  /** The log's structured attributes, when known and allowed to be shown. */
  attributes?: Record<string, unknown> | null
}

/** Overview for any log without a hand-written layout: common fields, then attributes by group. */
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
      <CollapsibleDetailSection title="Log" icon={ScrollText}>
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
          title={section.title}
          icon={SECTION_ICONS[section.id]}
          defaultOpen={false}
        >
          {section.fields.map(({ key, label, value }) => (
            <LogFieldRow
              key={key}
              label={label}
              value={typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
              filterFields={filterFields}
              table={table}
              alignOffset={38}
              className="pl-[38px]"
            >
              <LogFields data={value} />
            </LogFieldRow>
          ))}
        </CollapsibleDetailSection>
      ))}
    </>
  )
}
