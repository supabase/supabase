'use client'

import { useTheme } from 'next-themes'
import Image from 'next/image'
import { useState } from 'react'
import { Button } from 'ui'

import {
  PipelineDestinationSelection,
  type PipelineDestinationType,
} from '../../../../studio/components/interfaces/Database/Replication/CreatePipeline/PipelineDestinationSelection'
import bigQuery from '../../../../studio/public/img/icons/bigquery-icon.svg'
import clickHouseDark from '../../../../studio/public/img/icons/clickhouse-icon-on-dark.svg'
import clickHouseLight from '../../../../studio/public/img/icons/clickhouse-icon-on-light.svg'
import duckLakeDark from '../../../../studio/public/img/icons/ducklake-icon-on-dark.svg'
import duckLakeLight from '../../../../studio/public/img/icons/ducklake-icon-on-light.svg'
import snowflake from '../../../../studio/public/img/icons/snowflake-icon.svg'

export default function PipelineDestinationSelectionExample() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const logos = {
    BigQuery: bigQuery,
    DuckLake: isDark ? duckLakeDark : duckLakeLight,
    Snowflake: snowflake,
    ClickHouse: isDark ? clickHouseDark : clickHouseLight,
  }
  const [value, setValue] = useState<PipelineDestinationType | null>('BigQuery')
  const [isDisabled, setIsDisabled] = useState(false)
  return (
    <div className="w-full max-w-xl space-y-6">
      <div>
        <h2 className="text-xl text-foreground">Choose a destination</h2>
        <p className="text-sm text-foreground-light">Where should this database be replicated?</p>
      </div>
      <PipelineDestinationSelection
        availableDestinations={['BigQuery', 'DuckLake', 'Snowflake', 'ClickHouse']}
        value={value}
        onChange={setValue}
        disabled={isDisabled}
        renderLogo={(type) => (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-surface-100">
            <Image src={logos[type]} alt="" width={16} height={16} />
          </span>
        )}
      />
      <p className="text-sm text-foreground-light" aria-live="polite">
        Selected: {value}
      </p>
      <Button type="button" onClick={() => setIsDisabled(!isDisabled)}>
        {isDisabled ? 'Enable selection' : 'Disable selection'}
      </Button>
    </div>
  )
}
