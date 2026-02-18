import { useFlag } from 'common'
import { AnalyticsBucket, BigQuery, Database } from 'icons'
import { parseAsInteger, parseAsStringEnum, useQueryState } from 'nuqs'
import { Badge, RadioGroupStacked, RadioGroupStackedItem, cn } from 'ui'

import { useDestinationInformation } from '../useDestinationInformation'
import { useIsETLPrivateAlpha } from '../useIsETLPrivateAlpha'
import { DestinationType } from './DestinationPanel.types'
import { InlineLink } from '@/components/ui/InlineLink'

export const DestinationTypeSelection = () => {
  const enablePgReplicate = useIsETLPrivateAlpha()
  const unifiedReplication = useFlag('unifiedReplication')
  const etlEnableBigQuery = useFlag('etlEnableBigQuery')
  const etlEnableIceberg = useFlag('etlEnableIceberg')

  const numberOfTypes = [unifiedReplication, etlEnableBigQuery, etlEnableIceberg].filter(
    Boolean
  ).length

  const [urlDestinationType, setDestinationType] = useQueryState(
    'type',
    parseAsStringEnum<DestinationType>([
      'Read Replica',
      'BigQuery',
      'Analytics Bucket',
    ]).withOptions({
      history: 'push',
      clearOnDefault: true,
    })
  )

  const [edit] = useQueryState(
    'edit',
    parseAsInteger.withOptions({ history: 'push', clearOnDefault: true })
  )
  const editMode = edit !== null

  const { type: existingDestinationType } = useDestinationInformation({ id: edit })
  const destinationType = existingDestinationType ?? urlDestinationType

  return (
    <div className="px-5 py-5">
      <div className="flex flex-col gap-y-1 mb-4">
        <p className="text-sm font-medium text-foreground">Type</p>
        <p className="text-foreground-light text-sm">
          The destination type cannot be changed after creation
        </p>
      </div>
      <RadioGroupStacked
        disabled={editMode}
        value={destinationType}
        onValueChange={(value) => setDestinationType(value as DestinationType)}
        className={cn(
          'grid [&>button>div]:py-4',
          numberOfTypes === 3 ? 'grid-cols-3' : numberOfTypes === 2 ? 'grid-cols-2' : 'grid-cols-1',
          '[&>button:first-of-type]:rounded-none [&>button:last-of-type]:rounded-none',
          '[&>button:first-of-type]:!rounded-l-lg [&>button:last-of-type]:!rounded-r-lg'
        )}
      >
        {((!editMode && unifiedReplication) ||
          (editMode && destinationType === 'Read Replica')) && (
          <RadioGroupStackedItem
            label=""
            showIndicator={false}
            id="Read Replica"
            value="Read Replica"
          >
            <div className="flex flex-col gap-y-2">
              <Database size={20} />
              <div className="flex flex-col gap-y-0.5 text-sm text-left">
                <p>Read Replica</p>
                <p className="text-foreground-lighter">
                  Deploy read-only databases across multiple regions for lower latency and better
                  resource management
                </p>
              </div>
            </div>
          </RadioGroupStackedItem>
        )}

        {((!editMode && etlEnableBigQuery) || (editMode && destinationType === 'BigQuery')) && (
          <RadioGroupStackedItem label="" showIndicator={false} id="BigQuery" value="BigQuery">
            <div className="flex flex-col gap-y-2">
              <BigQuery size={20} />
              <div className="flex flex-col gap-y-0.5 text-sm text-left">
                <div className="flex items-center gap-x-2">
                  <p>BigQuery</p>
                  {unifiedReplication && <Badge>Alpha</Badge>}
                </div>
                <p className="text-foreground-lighter">
                  Send data to Google Cloud's data warehouse for analytics and business intelligence
                </p>
              </div>
            </div>
          </RadioGroupStackedItem>
        )}

        {((!editMode && etlEnableIceberg) ||
          (editMode && destinationType === 'Analytics Bucket')) && (
          <RadioGroupStackedItem
            label=""
            showIndicator={false}
            id="Analytics Bucket"
            value="Analytics Bucket"
          >
            <div className="flex flex-col gap-y-2">
              <AnalyticsBucket size={20} />
              <div className="flex flex-col gap-y-0.5 text-sm text-left">
                <div className="flex items-center gap-x-2">
                  <p>Analytics Bucket</p>
                  {unifiedReplication && <Badge>Alpha</Badge>}
                </div>
                <p className="text-foreground-lighter">
                  Send data to Apache Iceberg tables in your Supabase Storage for flexible analytics
                  workflows
                </p>
              </div>
            </div>
          </RadioGroupStackedItem>
        )}
      </RadioGroupStacked>

      {destinationType !== 'Read Replica' && enablePgReplicate && (
        <p className="mt-3 text-sm text-foreground-light">
          Replication is in alpha. Expect rapid changes and possible breaking updates.{' '}
          <InlineLink href="https://github.com/orgs/supabase/discussions/39416">
            Leave feedback
          </InlineLink>
        </p>
      )}
    </div>
  )
}
