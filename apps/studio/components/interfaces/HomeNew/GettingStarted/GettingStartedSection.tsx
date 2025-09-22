import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useCallback, useMemo, useState } from 'react'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'

import { FRAMEWORKS } from 'components/interfaces/Connect/Connect.constants'
import { Code, Table2 } from 'lucide-react'
import { GettingStarted } from './GettingStarted'
import { FrameworkSelector } from './FrameworkSelector'
import {
  DEFAULT_FRAMEWORK_KEY,
  getCodeWorkflowSteps,
  getNoCodeWorkflowSteps,
} from './GettingStarted.utils'
import {
  GettingStartedAction,
  GettingStartedState,
  GettingStartedStep,
} from './GettingStarted.types'
import { useGettingStartedProgress } from './useGettingStartedProgress'
import { Button, Card, CardContent, ToggleGroup, ToggleGroupItem } from 'ui'
import { BASE_PATH } from 'lib/constants'

export function GettingStartedSection({
  value,
  onChange,
}: {
  value: GettingStartedState
  onChange: (v: GettingStartedState) => void
}) {
  const { ref } = useParams()
  const aiSnap = useAiAssistantStateSnapshot()
  const router = useRouter()

  const [selectedFramework, setSelectedFramework] = useState<string>(DEFAULT_FRAMEWORK_KEY)
  const workflow: 'no-code' | 'code' | null = value === 'code' || value === 'no-code' ? value : null

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
            onValueChange={(v) => v && onChange(v as 'no-code' | 'code')}
          >
            <ToggleGroupItem
              value="no-code"
              aria-label="No-code workflow"
              size="sm"
              className="text-xs gap-2 h-auto"
            >
              <Table2 size={16} strokeWidth={1.5} />
              Code
            </ToggleGroupItem>
            <ToggleGroupItem
              value="code"
              size="sm"
              aria-label="Code workflow"
              className="text-xs gap-2 h-auto"
            >
              <Code size={16} strokeWidth={1.5} />
              No-code
            </ToggleGroupItem>
          </ToggleGroup>
          <Button size="tiny" type="outline" onClick={() => onChange('hidden')}>
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
                onClick={() => onChange('no-code')}
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
                onClick={() => onChange('code')}
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
        <GettingStarted steps={steps} />
      )}
    </section>
  )
}
