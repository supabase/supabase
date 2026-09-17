/**
 * TEMPORARY — local design control. Do not merge.
 *
 * Account-menu switcher for the states in data/replication/dev-fixtures.ts, so every pipeline state
 * can be reviewed without a live ETL pipeline. Delete this file with the fixtures.
 */
import { useQueryClient } from '@tanstack/react-query'
import { FlaskConical } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from 'ui'

import {
  getPipelineFixtureScenario,
  PIPELINE_FIXTURE_SCENARIO_LABEL,
  PIPELINE_FIXTURE_SCENARIOS,
  setPipelineFixtureScenario,
  subscribeToPipelineFixtureScenario,
  USE_REPLICATION_DEV_FIXTURES,
  type PipelineFixtureScenario,
} from '@/data/replication/dev-fixtures'

export const PipelineFixtureController = () => {
  const queryClient = useQueryClient()
  const scenario = useSyncExternalStore(
    subscribeToPipelineFixtureScenario,
    getPipelineFixtureScenario,
    getPipelineFixtureScenario
  )

  if (!USE_REPLICATION_DEV_FIXTURES) return null

  const onSelectScenario = (next: string) => {
    setPipelineFixtureScenario(next as PipelineFixtureScenario)
    queryClient.invalidateQueries({ queryKey: ['projects'] })
  }

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="flex cursor-pointer gap-2">
        <FlaskConical size={14} strokeWidth={1.5} className="text-foreground-lighter" />
        Pipeline fixtures
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="max-h-[min(70vh,32rem)] w-72 overflow-y-auto">
        <DropdownMenuRadioGroup value={scenario} onValueChange={onSelectScenario}>
          {PIPELINE_FIXTURE_SCENARIOS.map((option) => (
            <DropdownMenuRadioItem key={option} value={option}>
              {PIPELINE_FIXTURE_SCENARIO_LABEL[option]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
