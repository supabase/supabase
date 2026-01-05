import { useFlag } from 'common'
import { AnalyticsBucket, BigQuery, Database } from 'icons'
import { cn, RadioGroupStacked, RadioGroupStackedItem } from 'ui'
import { DestinationType } from './DestinationPanel.types'

type DestinationTypeSelectionProps = {
  editMode: boolean
  selectedType: DestinationType
  setSelectedType: (value: DestinationType) => void
}

export const DestinationTypeSelection = ({
  editMode,
  selectedType,
  setSelectedType,
}: DestinationTypeSelectionProps) => {
  const unifiedReplication = useFlag('unifiedReplication')
  const etlEnableBigQuery = useFlag('etlEnableBigQuery')
  const etlEnableIceberg = useFlag('etlEnableIceberg')

  const numberOfTypes = [unifiedReplication, etlEnableBigQuery, etlEnableIceberg].filter(
    Boolean
  ).length

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
        value={selectedType}
        onValueChange={(value) => setSelectedType(value as DestinationType)}
        className={cn(
          'grid [&>button>div]:py-4',
          numberOfTypes === 3 ? 'grid-cols-3' : numberOfTypes === 2 ? 'grid-cols-2' : 'grid-cols-1',
          '[&>button:first-of-type]:rounded-none [&>button:last-of-type]:rounded-none',
          '[&>button:first-of-type]:!rounded-l-lg [&>button:last-of-type]:!rounded-r-lg'
        )}
      >
        {((!editMode && unifiedReplication) || (editMode && selectedType === 'Read Replica')) && (
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

        {((!editMode && etlEnableBigQuery) || (editMode && selectedType === 'BigQuery')) && (
          <RadioGroupStackedItem label="" showIndicator={false} id="BigQuery" value="BigQuery">
            <div className="flex flex-col gap-y-2">
              <BigQuery size={20} />
              <div className="flex flex-col gap-y-0.5 text-sm text-left">
                <p>BigQuery</p>
                <p className="text-foreground-lighter">
                  Send data to Google Cloud's data warehouse for analytics and business intelligence
                </p>
              </div>
            </div>
          </RadioGroupStackedItem>
        )}

        {((!editMode && etlEnableIceberg) || (editMode && selectedType === 'Analytics Bucket')) && (
          <RadioGroupStackedItem
            label=""
            showIndicator={false}
            id="Analytics Bucket"
            value="Analytics Bucket"
          >
            <div className="flex flex-col gap-y-2">
              <AnalyticsBucket size={20} />
              <div className="flex flex-col gap-y-0.5 text-sm text-left">
                <p>Analytics Bucket</p>
                <p className="text-foreground-lighter">
                  Send data to Apache Iceberg tables in your Supabase Storage for flexible analytics
                  workflows
                </p>
              </div>
            </div>
          </RadioGroupStackedItem>
        )}
      </RadioGroupStacked>
    </div>
  )
}
