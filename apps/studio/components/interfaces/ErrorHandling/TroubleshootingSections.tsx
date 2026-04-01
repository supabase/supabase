'use client'

import { ExternalLink } from 'lucide-react'
import { useState } from 'react'
import {
  AccordionContent_Shadcn_ as AccordionContent,
  AccordionItem_Shadcn_ as AccordionItem,
  AccordionTrigger_Shadcn_ as AccordionTrigger,
  Button,
} from 'ui'

import { RestartProjectDialog } from './RestartProjectDialog'
import { AiAssistantDropdown } from '@/components/ui/AiAssistantDropdown'
import { useTrack } from '@/lib/telemetry/track'

interface StepTriggerProps {
  number: number
  title: string
}

function StepTrigger({ number, title }: StepTriggerProps) {
  return (
    <AccordionTrigger className="py-3 hover:no-underline">
      <div className="flex items-center gap-2.5">
        <span className="flex-shrink-0 w-6 h-6 border border-button-hover text-foreground font-mono tabular-nums bg-button rounded-md text-xs font-medium flex items-center justify-center">
          {number}
        </span>
        <span className="text-sm font-medium text-foreground text-left">{title}</span>
      </div>
    </AccordionTrigger>
  )
}

interface RestartDatabaseTroubleshootingSectionProps {
  number: number
  errorType: string
  /** Override the restart handler. If not provided, opens the restart dialog internally. */
  onRestartProject?: () => void
}

export function RestartDatabaseTroubleshootingSection({
  number,
  errorType,
  onRestartProject,
}: RestartDatabaseTroubleshootingSectionProps) {
  const track = useTrack()
  const [showDialog, setShowDialog] = useState(false)

  const handleClick = () => {
    track('inline_error_troubleshooter_action_clicked', {
      errorType,
      ctaType: 'restart_db',
    })
    if (onRestartProject) {
      onRestartProject()
    } else {
      setShowDialog(true)
    }
  }

  return (
    <>
      <AccordionItem
        value={`step-${number}`}
        className="border-b border-default last:border-b-0 px-3 py-2"
      >
        <StepTrigger number={number} title="Try restarting your project" />
        <AccordionContent className="pt-1">
          <div className="px-2">
            <p className="text-sm text-foreground-light mb-3">
              Restarting your project can help resolve timeout errors or stale connections.
            </p>
            <Button type="default" size="tiny" onClick={handleClick}>
              Restart project
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>

      <RestartProjectDialog
        visible={showDialog}
        onClose={() => setShowDialog(false)}
        restartType="database"
      />
    </>
  )
}

interface TroubleshootingGuideSectionProps {
  number: number
  errorType: string
  href: string
  title?: string
  description?: string
}

export function TroubleshootingGuideSection({
  number,
  errorType,
  href,
  title = 'Try our troubleshooting guide',
  description,
}: TroubleshootingGuideSectionProps) {
  const track = useTrack()

  return (
    <AccordionItem
      value={`step-${number}`}
      className="border-b border-default last:border-b-0 px-3 py-2"
    >
      <StepTrigger number={number} title={title} />
      <AccordionContent className="pt-1">
        <div className="px-2">
          {description && <p className="text-sm text-foreground-light mb-3">{description}</p>}
          <Button
            asChild
            type="default"
            size="tiny"
            onClick={() =>
              track('inline_error_troubleshooter_action_clicked', {
                errorType,
                ctaType: 'troubleshooting_guide',
              })
            }
            iconRight={<ExternalLink />}
          >
            <a href={href} target="_blank" rel="noopener noreferrer">
              View troubleshooting guide
            </a>
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

interface FixWithAITroubleshootingSectionProps {
  number: number
  errorType: string
  description?: string
  onDebugWithAI?: (prompt: string) => void
  buildPrompt: () => string
}

export function FixWithAITroubleshootingSection({
  number,
  errorType,
  description = 'Let our AI assistant help diagnose and suggest solutions.',
  onDebugWithAI,
  buildPrompt,
}: FixWithAITroubleshootingSectionProps) {
  const track = useTrack()

  return (
    <AccordionItem
      value={`step-${number}`}
      className="border-b border-default last:border-b-0 px-3 py-2"
    >
      <StepTrigger number={number} title="Debug with AI" />
      <AccordionContent className="pt-1">
        <div className="px-2">
          <p className="text-sm text-foreground-light mb-3">{description}</p>
          <AiAssistantDropdown
            label="Debug with AI"
            buildPrompt={buildPrompt}
            onOpenAssistant={() => {
              track('inline_error_troubleshooter_action_clicked', {
                errorType,
                ctaType: 'ask_ai',
              })
              onDebugWithAI?.(buildPrompt())
            }}
            size="tiny"
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
