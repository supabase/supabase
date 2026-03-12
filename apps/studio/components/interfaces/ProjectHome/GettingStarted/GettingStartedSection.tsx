import { IS_PLATFORM, useParams } from 'common'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { BASE_PATH } from 'lib/constants'
import { useTrack } from 'lib/telemetry/track'
import { Code, Table2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { Button, Card, CardContent, ToggleGroup, ToggleGroupItem } from 'ui'

import { GettingStarted } from './GettingStarted'
import {
  GettingStartedAction,
  GettingStartedState,
  GettingStartedStep,
} from './GettingStarted.types'
import { getCodeWorkflowSteps, getNoCodeWorkflowSteps } from './GettingStarted.utils'
import { useGettingStartedProgress } from './useGettingStartedProgress'
import { ConnectButton } from '@/components/interfaces/ConnectButton/ConnectButton'

interface GettingStartedSectionProps {
  value: GettingStartedState
  onChange: (v: GettingStartedState) => void
}

export function GettingStartedSection({ value, onChange }: GettingStartedSectionProps) {
  const { ref } = useParams()
  const track = useTrack()
  const aiSnap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()

  const workflow: 'no-code' | 'code' | null = value === 'code' || value === 'no-code' ? value : null
  const [previousWorkflow, setPreviousWorkflow] = useState<'no-code' | 'code' | null>(null)

  const statuses = useGettingStartedProgress()

  const openAiChat = useCallback(
    (name: string, initialInput: string) => {
      openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
      aiSnap.newChat({ name, initialInput })
    },
    [aiSnap, openSidebar]
  )

  const connectActions: GettingStartedAction[] = useMemo(() => {
    return [
      {
        label: 'Connect',
        component: <ConnectButton buttonType="primary" />,
      },
    ]
  }, [])

  const codeSteps: GettingStartedStep[] = useMemo(
    () =>
      getCodeWorkflowSteps({
        ref,
        openAiChat,
        connectActions,
        statuses,
      }),
    [connectActions, openAiChat, ref, statuses]
  )

  const noCodeSteps: GettingStartedStep[] = useMemo(
    () =>
      getNoCodeWorkflowSteps({
        ref,
        openAiChat,
        connectActions,
        statuses,
      }),
    [connectActions, openAiChat, ref, statuses]
  )

  const steps = workflow === 'code' ? codeSteps : workflow === 'no-code' ? noCodeSteps : []

  const hasTrackedExposure = useRef(false)

  useEffect(() => {
    if (!IS_PLATFORM) return
    if (hasTrackedExposure.current) return

    hasTrackedExposure.current = true

    track('home_getting_started_section_exposed', {
      workflow: workflow === 'no-code' ? 'no_code' : workflow === 'code' ? 'code' : null,
    })
  }, [workflow, track])

  return (
    <section className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="heading-section">Getting started</h3>
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={workflow ?? undefined}
            onValueChange={(v) => {
              if (v) {
                const newWorkflow = v as 'no-code' | 'code'
                setPreviousWorkflow(workflow)
                onChange(newWorkflow)
                track('home_getting_started_workflow_clicked', {
                  workflow: newWorkflow === 'no-code' ? 'no_code' : 'code',
                  is_switch: previousWorkflow !== null,
                })
              }
            }}
          >
            <ToggleGroupItem
              value="no-code"
              aria-label="No-code workflow"
              size="sm"
              className="text-xs gap-2 h-auto"
            >
              <Table2 size={16} strokeWidth={1.5} />
              No-code
            </ToggleGroupItem>
            <ToggleGroupItem
              value="code"
              size="sm"
              aria-label="Code workflow"
              className="text-xs gap-2 h-auto"
            >
              <Code size={16} strokeWidth={1.5} />
              Code
            </ToggleGroupItem>
          </ToggleGroup>
          <Button
            size="tiny"
            type="outline"
            onClick={() => {
              onChange('hidden')
              if (workflow) {
                const completedSteps = (workflow === 'code' ? codeSteps : noCodeSteps).filter(
                  (step) => step.status === 'complete'
                ).length
                const totalSteps = (workflow === 'code' ? codeSteps : noCodeSteps).length
                track('home_getting_started_closed', {
                  workflow: workflow === 'no-code' ? 'no_code' : 'code',
                  steps_completed: completedSteps,
                  total_steps: totalSteps,
                })
              }
            }}
          >
            Dismiss
          </Button>
        </div>
      </div>

      {steps.length === 0 ? (
        <Card className="bg-background/25 border-dashed relative">
          <div className="absolute -inset-16 z-0 opacity-50">
            <img
              src={`${BASE_PATH}/img/reports/bg-grafana-dark.svg`}
              alt="Supabase Grafana"
              className="w-full h-full object-cover object-right hidden dark:block"
            />
            <img
              src={`${BASE_PATH}/img/reports/bg-grafana-light.svg`}
              alt="Supabase Grafana"
              className="w-full h-full object-cover object-right dark:hidden"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background-alternative to-transparent" />
          </div>
          <CardContent className="relative z-10 p-8 md:p-12 grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="heading-subSection mb-0 heading-meta text-foreground-light mb-4">
                Choose a preferred workflow
              </h2>
              <p className="text-foreground">
                With Supabase, you have the flexibility to adopt a workflow that works for you. You
                can do everything via the dashboard, or manage your entire project within your own
                codebase.
              </p>
            </div>
            <div className="flex items-stretch gap-4">
              <Button
                size="medium"
                type="outline"
                onClick={() => {
                  setPreviousWorkflow(workflow)
                  onChange('no-code')
                  track('home_getting_started_workflow_clicked', {
                    workflow: 'no_code',
                    is_switch: previousWorkflow !== null,
                  })
                }}
                className="block gap-2 h-auto p-4 md:p-8 max-w-80 text-left justify-start bg-background "
              >
                <Table2 size={20} strokeWidth={1.5} className="text-brand" />
                <div className="mt-4">
                  <div>No-code</div>
                  <div className="text-foreground-light w-full whitespace-normal">
                    Ideal for prototyping or getting your project up and running
                  </div>
                </div>
              </Button>
              <Button
                size="medium"
                type="outline"
                onClick={() => {
                  setPreviousWorkflow(workflow)
                  onChange('code')
                  track('home_getting_started_workflow_clicked', {
                    workflow: 'code',
                    is_switch: previousWorkflow !== null,
                  })
                }}
                className="bg-background block gap-2 h-auto p-4 md:p-8 max-w-80 text-left justify-start"
              >
                <Code size={20} strokeWidth={1.5} className="text-brand" />
                <div className="mt-4">
                  <div>Code</div>
                  <div className="text-foreground-light whitespace-normal">
                    Ideal for teams that want full control of their project
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <GettingStarted
          steps={steps}
          onStepClick={({ stepIndex, stepTitle, actionType, wasCompleted }) => {
            if (workflow) {
              track('home_getting_started_step_clicked', {
                workflow: workflow === 'no-code' ? 'no_code' : 'code',
                step_number: stepIndex + 1,
                step_title: stepTitle,
                action_type: actionType,
                was_completed: wasCompleted,
              })
            }
          }}
        />
      )}
    </section>
  )
}
