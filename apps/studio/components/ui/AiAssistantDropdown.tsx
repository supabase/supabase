import { AiAssistantSource } from 'common/telemetry-constants'
import { Chatgpt, Claude } from 'icons'
import { Check, ChevronDown, Copy } from 'lucide-react'
import { ComponentProps, ReactNode, useEffect, useState } from 'react'
import {
  AiIconAnimation,
  Button,
  cn,
  copyToClipboard,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import { useTrack } from '@/lib/telemetry/track'

type TelemetrySource = AiAssistantSource

const EXTERNAL_AI_TOOLS = [
  {
    label: 'Ask ChatGPT',
    url: 'https://chatgpt.com/',
    promptParam: 'q',
    icon: Chatgpt,
    toolId: 'chatgpt' as const,
  },
  {
    label: 'Ask Claude',
    url: 'https://claude.ai/new',
    promptParam: 'q',
    icon: Claude,
    toolId: 'claude' as const,
  },
]

export interface AiAssistantDropdownItem {
  label: string
  icon?: ReactNode
  onClick: () => void
}

export interface AiAssistantDropdownProps {
  buildPrompt: () => string
  label: string
  iconOnly?: boolean
  onOpenAssistant: () => void
  telemetrySource?: TelemetrySource
  size?: ComponentProps<typeof Button>['size']
  type?: ComponentProps<typeof Button>['type']
  disabled?: boolean
  loading?: boolean
  className?: string
  tooltip?: string
  copyLabel?: string
  showExternalAI?: boolean
  extraDropdownItems?: ReactNode
  additionalDropdownItems?: AiAssistantDropdownItem[]
}

export function AiAssistantDropdown({
  buildPrompt,
  label,
  iconOnly = false,
  onOpenAssistant,
  telemetrySource,
  size = 'tiny',
  type = 'default',
  disabled = false,
  loading = false,
  className,
  tooltip,
  copyLabel = 'Copy prompt',
  showExternalAI = false,
  extraDropdownItems,
  additionalDropdownItems,
}: AiAssistantDropdownProps) {
  const track = useTrack()
  const [showCopied, setShowCopied] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!showCopied) return
    const timer = setTimeout(() => setShowCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [showCopied])

  const handleCopyPrompt = () => {
    const prompt = buildPrompt()
    copyToClipboard(prompt)
    setShowCopied(true)
    setIsOpen(false)

    if (telemetrySource) {
      track('ai_prompt_copied', { source: telemetrySource })
    }
  }

  const handleOpenExternalAI = (tool: (typeof EXTERNAL_AI_TOOLS)[number]) => {
    const prompt = buildPrompt()
    window.open(
      `${tool.url}?${tool.promptParam}=${encodeURIComponent(prompt)}`,
      '_blank',
      'noreferrer'
    )

    if (telemetrySource) {
      track('ai_external_tool_clicked', { source: telemetrySource, tool: tool.toolId })
    }
  }

  const handleOpenAssistant = () => {
    onOpenAssistant()

    if (telemetrySource) {
      track('ai_assistant_dropdown_button_clicked', { source: telemetrySource })
    }
  }

  const buttonContent = (
    <div className={cn('flex items-center', iconOnly ? 'gap-0' : 'gap-0')}>
      {/* Main button */}
      <Button
        type={type}
        size={size}
        disabled={disabled}
        onClick={handleOpenAssistant}
        icon={<AiIconAnimation size={iconOnly ? 16 : 14} loading={loading} />}
        className={cn('rounded-r-none border-r-0', iconOnly && 'px-1.5', className)}
      >
        {!iconOnly && label}
      </Button>

      {/* Dropdown trigger */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type={type}
            size={size}
            disabled={disabled}
            className={cn('rounded-l-none px-1', iconOnly && 'px-1')}
            icon={<ChevronDown size={12} />}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {extraDropdownItems}
          <DropdownMenuItem onClick={handleCopyPrompt} className="gap-2">
            {showCopied ? <Check size={14} className="text-brand" /> : <Copy size={14} />}
            {showCopied ? 'Copied!' : copyLabel}
          </DropdownMenuItem>
          {showExternalAI && (
            <>
              <DropdownMenuSeparator />
              {EXTERNAL_AI_TOOLS.map((tool) => (
                <DropdownMenuItem
                  key={tool.url}
                  className="gap-2"
                  onClick={() => handleOpenExternalAI(tool)}
                >
                  <tool.icon size={14} />
                  {tool.label}
                </DropdownMenuItem>
              ))}
            </>
          )}
          {additionalDropdownItems && additionalDropdownItems.length > 0 && (
            <>
              <DropdownMenuSeparator />
              {additionalDropdownItems.map((item, i) => (
                <DropdownMenuItem key={i} onClick={item.onClick} className="gap-2">
                  {item.icon}
                  {item.label}
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )

  // Wrap in tooltip for icon-only mode
  if (iconOnly && tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex">{buttonContent}</div>
        </TooltipTrigger>
        <TooltipContent side="bottom">{tooltip}</TooltipContent>
      </Tooltip>
    )
  }

  return buttonContent
}
