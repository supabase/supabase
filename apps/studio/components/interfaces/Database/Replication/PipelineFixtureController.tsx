/**
 * TEMPORARY — local design control. Do not merge.
 *
 * Floating switcher for the states in data/replication/dev-fixtures.ts, so every pipeline state can
 * be reviewed without a live ETL pipeline. Delete this file with the fixtures.
 */
import { useQueryClient } from '@tanstack/react-query'
import { FlaskConical } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          icon={<FlaskConical />}
          className="fixed bottom-4 right-4 z-50 shadow-lg"
        >
          {PIPELINE_FIXTURE_SCENARIO_LABEL[scenario]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" className="w-72">
        <DropdownMenuLabel>Pipeline state</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={scenario} onValueChange={onSelectScenario}>
          {PIPELINE_FIXTURE_SCENARIOS.map((option) => (
            <DropdownMenuRadioItem key={option} value={option}>
              {PIPELINE_FIXTURE_SCENARIO_LABEL[option]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <p className="px-2 py-1.5 text-xs text-foreground-lighter">
          Local fixture only. Not part of any reviewable branch.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
