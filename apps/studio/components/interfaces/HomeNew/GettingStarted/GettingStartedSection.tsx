import { Code, Table2 } from 'lucide-react'
import { useRouter } from 'next/router'
import { useCallback, useMemo, useState } from 'react'

import { useParams } from 'common'
import { FRAMEWORKS } from 'components/interfaces/Connect/Connect.constants'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { BASE_PATH } from 'lib/constants'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { Button, Card, CardContent, ToggleGroup, ToggleGroupItem } from 'ui'
import { FrameworkSelector } from './FrameworkSelector'
import { GettingStarted } from './GettingStarted'
import {
  GettingStartedAction,
  GettingStartedState,
  GettingStartedStep,
} from './GettingStarted.types'
import {
  DEFAULT_FRAMEWORK_KEY,
  getCodeWorkflowSteps,
  getNoCodeWorkflowSteps,
} from './GettingStarted.utils'
import { useGettingStartedProgress } from './useGettingStartedProgress'

interface GettingStartedSectionProps {
  value: GettingStartedState
  onChange: (v: GettingStartedState) => void
}

export function GettingStartedSection({ value, onChange }: GettingStartedSectionProps) {
  const router = useRouter()
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()
  const { mutate: sendEvent } = useSendEventMutation()
  const aiSnap = useAiAssistantStateSnapshot()

  const [selectedFramework, setSelectedFramework] = useState<string>(DEFAULT_FRAMEWORK_KEY)
  const workflow: 'no-code' | 'code' | null = value === 'code' || value === 'no-code' ? value : null
  const [previousWorkflow, setPreviousWorkflow] = useState<'no-code' | 'code' | null>(null)

  const statuses = useGettingStartedProgress()

  const openAiChat = useCallback(
    (name: string, initialInput: string) => aiSnap.newChat({ name, open: true, initialInput }),
    [aiSnap]
  )

  const openConnect = useCallback(() => {
    router.push(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          showConnect: true,
          connectTab: 'frameworks',
          framework: selectedFramework,
        },
      },
      undefined,
      { shallow: true }
    )
  }, [router, selectedFramework])

  const connectActions: GettingStartedAction[] = useMemo(
    () => [
      {
        label: 'Framework selector',
        component: (
          <FrameworkSelector
            value={selectedFramework}
            onChange={setSelectedFramework}
            items={FRAMEWORKS}
          />
        ),
      },
      {
        label: 'Connect',
        variant: 'primary',
        onClick: openConnect,
      },
    ],
    [openConnect, selectedFramework]
  )

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
                sendEvent({
                  action: 'home_getting_started_workflow_clicked',
                  properties: {
                    workflow: newWorkflow === 'no-code' ? 'no_code' : 'code',
                    is_switch: previousWorkflow !== null,
                  },
                  groups: {
                    project: project?.ref || '',
                    organization: organization?.slug || '',
                  },
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
                sendEvent({
                  action: 'home_getting_started_closed',
                  properties: {
                    workflow: workflow === 'no-code' ? 'no_code' : 'code',
                    steps_completed: completedSteps,
                    total_steps: totalSteps,
                  },
                  groups: {
                    project: project?.ref || '',
                    organization: organization?.slug || '',
                  },
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
                  sendEvent({
                    action: 'home_getting_started_workflow_clicked',
                    properties: {
                      workflow: 'no_code',
                      is_switch: previousWorkflow !== null,
                    },
                    groups: {
                      project: project?.ref || '',
                      organization: organization?.slug || '',
                    },
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
                  sendEvent({
                    action: 'home_getting_started_workflow_clicked',
                    properties: {
                      workflow: 'code',
                      is_switch: previousWorkflow !== null,
                    },
                    groups: {
                      project: project?.ref || '',
                      organization: organization?.slug || '',
                    },
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
              sendEvent({
                action: 'home_getting_started_step_clicked',
                properties: {
                  workflow: workflow === 'no-code' ? 'no_code' : 'code',
                  step_number: stepIndex + 1,
                  step_title: stepTitle,
                  action_type: actionType,
                  was_completed: wasCompleted,
                },
                groups: {
                  project: project?.ref || '',
                  organization: organization?.slug || '',
                },
              })
            }
          }}
        />
      )}
    </section>
  )
}
