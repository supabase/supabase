import { CheckIcon, CopyIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useEffect, useId, useState } from 'react'
import { Button, Card, copyToClipboard } from 'ui'
import { getMcpClientIconSrc } from 'ui-patterns/McpUrlBuilder/utils/getMcpIconSrc'

import { useAgentPrompt } from './useAgentPrompt'
import { useTrack } from '@/lib/telemetry/track'
import { useAppStateSnapshot } from '@/state/app-state'

const AGENTS = [
  { label: 'Claude Code', icon: 'claude', hasDistinctDarkIcon: false },
  { label: 'Codex', icon: 'openai', hasDistinctDarkIcon: true },
  { label: 'Cursor', icon: 'cursor', hasDistinctDarkIcon: true },
  { label: 'GitHub Copilot', icon: 'copilot', hasDistinctDarkIcon: true },
  { label: 'Gemini CLI', icon: 'gemini-cli', hasDistinctDarkIcon: false },
]

function AgentLogos() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <ul className="flex flex-wrap items-center justify-center gap-2" aria-label="Works with">
      {AGENTS.map((agent) => (
        <li
          key={agent.icon}
          title={agent.label}
          className="flex size-10 items-center justify-center rounded-lg border bg-surface-100 shadow-xs"
        >
          <img
            src={getMcpClientIconSrc({
              icon: agent.icon,
              useDarkVariant: isDark,
              hasDistinctDarkIcon: agent.hasDistinctDarkIcon,
            })}
            alt={agent.label}
            width={20}
            height={20}
          />
        </li>
      ))}
    </ul>
  )
}

// Cell size of the faint dashed grid behind the knowledge base cover illustrations
const GRID_CELL_WIDTH = 96
const GRID_CELL_HEIGHT = 40

/** A faint dashed grid, in the style of the knowledge base covers, that fades into the card on the left. */
function DashedGrid() {
  const patternId = useId()

  return (
    <div aria-hidden="true" className="absolute inset-0">
      <svg className="absolute inset-0 size-full text-border-strong">
        <defs>
          <pattern
            id={patternId}
            width={GRID_CELL_WIDTH}
            height={GRID_CELL_HEIGHT}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M0 0.5H${GRID_CELL_WIDTH}M0.5 0V${GRID_CELL_HEIGHT}`}
              fill="none"
              stroke="currentColor"
              strokeDasharray="2 3"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
      <div className="absolute inset-y-0 left-0 w-40 bg-linear-to-r from-background-surface-100 to-transparent" />
    </div>
  )
}

function CopyPromptButton({ prompt, onCopied }: { prompt: string; onCopied: () => void }) {
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (!isCopied) return
    const timer = setTimeout(() => setIsCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [isCopied])

  const handleCopy = () => {
    copyToClipboard(prompt, () => {
      setIsCopied(true)
      onCopied()
    })
  }

  return (
    <>
      <Button
        variant="primary"
        size="small"
        icon={isCopied ? <CheckIcon strokeWidth={2} /> : <CopyIcon />}
        onClick={handleCopy}
      >
        {isCopied ? 'Copied' : 'Copy prompt'}
      </Button>
      <span className="sr-only" role="status" aria-live="polite">
        {isCopied ? 'Prompt copied' : ''}
      </span>
    </>
  )
}

export const AgentPromptSection = () => {
  const { setConnectSheetSource } = useAppStateSnapshot()
  const track = useTrack()
  const [, setShowConnect] = useQueryState('showConnect', parseAsBoolean.withDefault(false))

  const prompt = useAgentPrompt()

  const handleOpenConnect = () => {
    setConnectSheetSource('connect_section')
    setShowConnect(true)
  }

  return (
    <section className="w-full">
      <div className="mb-6">
        <h3 className="heading-section">Get started</h3>
      </div>

      <Card className="flex overflow-hidden">
        <div className="flex flex-1 flex-col gap-5 p-6">
          <div className="flex flex-col gap-1">
            <h4 className="text-base text-foreground">Prompt your agent</h4>
            <p className="max-w-lg text-sm text-foreground-light">
              Everything your agent needs to work on this project.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CopyPromptButton prompt={prompt} onCopied={() => track('home_agent_prompt_copied')} />
            <Button variant="default" size="small" onClick={handleOpenConnect}>
              Connect yourself
            </Button>
          </div>
        </div>
        <div className="relative hidden w-72 shrink-0 items-center justify-center px-6 md:flex xl:w-96">
          <DashedGrid />
          <div className="relative">
            <AgentLogos />
          </div>
        </div>
      </Card>
    </section>
  )
}
