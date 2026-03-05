import { AiPromptCopiedEvent } from 'common/telemetry-constants'
import { useTrack } from 'lib/telemetry/track'
import { Check, ChevronDown, Copy } from 'lucide-react'
import { ComponentProps, useEffect, useState } from 'react'
import {
  AiIconAnimation,
  Button,
  cn,
  copyToClipboard,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

type TelemetrySource = AiPromptCopiedEvent['properties']['source']

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

  const handleOpenAssistant = () => {
    onOpenAssistant()
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
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={handleCopyPrompt} className="gap-2">
            {showCopied ? <Check size={14} className="text-brand" /> : <Copy size={14} />}
            {showCopied ? 'Copied!' : 'Copy prompt'}
          </DropdownMenuItem>
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
