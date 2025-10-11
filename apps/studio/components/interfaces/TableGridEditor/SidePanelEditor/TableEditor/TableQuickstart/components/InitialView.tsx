import { memo } from 'react'
import { Wand2, ChevronDown, Database } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Button,
} from 'ui'
import { QuickstartVariant } from '../types'
import { tableTemplates } from '../templates'
import { AI_QUICK_IDEAS } from '../constants'
import { SelectorHeader } from './SharedComponents'

interface InitialViewProps {
  variant: Exclude<QuickstartVariant, QuickstartVariant.CONTROL>
  disabled?: boolean
  onDismiss?: () => void
  onCategorySelect: (category: string) => void
  onAISelect: () => void
  onQuickIdea: (idea: string) => void
}

export const InitialView = memo(
  ({
    variant,
    disabled,
    onDismiss,
    onCategorySelect,
    onAISelect,
    onQuickIdea,
  }: InitialViewProps) => {
    const isAI = variant === QuickstartVariant.AI
    const icon = isAI ? <Wand2 size={14} /> : <Database size={14} />
    const label = isAI ? 'Generate with AI' : 'Select from templates'

    return (
      <div className="space-y-2">
        <SelectorHeader onDismiss={onDismiss} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="default"
              size="small"
              disabled={disabled}
              className="w-full justify-between"
              iconRight={<ChevronDown size={16} />}
              aria-label={label}
            >
              <span className="flex items-center gap-2">
                {icon}
                {label}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[320px]">
            {isAI ? (
              <>
                <DropdownMenuItem onClick={onAISelect}>
                  <Wand2 size={14} className="mr-2" aria-hidden="true" />
                  Generate with AI...
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs text-foreground-light">Quick ideas</div>
                {AI_QUICK_IDEAS.map((example) => (
                  <DropdownMenuItem key={example} onClick={() => onQuickIdea(example)}>
                    {example}
                  </DropdownMenuItem>
                ))}
              </>
            ) : (
              Object.keys(tableTemplates).map((category) => (
                <DropdownMenuItem key={category} onClick={() => onCategorySelect(category)}>
                  <Database size={14} className="mr-2" aria-hidden="true" />
                  {category}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }
)

InitialView.displayName = 'InitialView'
