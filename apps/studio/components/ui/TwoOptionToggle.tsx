import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

interface TwoOptionToggleProps {
  options: string[]
  width?: number
  activeOption: string
  onClickOption: (value: string) => void
  borderOverride: string
  disabledOptions?: string[]
  disabledOptionTooltip?: string
}

export const TwoOptionToggle = ({
  options,
  width = 50,
  activeOption,
  onClickOption,
  borderOverride = 'border-stronger',
  disabledOptions = [],
  disabledOptionTooltip,
}: TwoOptionToggleProps) => {
  const buttonStyle = (
    isActive: boolean
  ) => `absolute top-0 z-1 text-xs inline-flex h-full items-center justify-center font-medium
    ${
      isActive ? 'hover:text-foreground-light hover:text-foreground' : 'hover:text-foreground'
    } hover:text-foreground focus-visible:z-10 focus-ring`

  return (
    <div
      className={`relative border ${borderOverride} rounded-md h-7`}
      style={{ padding: 1, width: (width + 1) * 2 }}
      role="group"
    >
      <span
        style={{ width, translate: activeOption === options[1] ? '0px' : `${width - 2}px` }}
        aria-hidden="true"
        className={cn(
          'z-0 inline-block rounded-sm h-full bg-overlay-hover shadow-sm transform',
          'transition-all ease-in-out border border-strong'
        )}
      />
      {options.map((option, index: number) => {
        const isDisabled = disabledOptions.includes(option)
        const isActive = activeOption === option
        const optionButton = (
          <button
            key={`toggle_${index}`}
            type="button"
            tabIndex={0}
            aria-pressed={isActive}
            // Prefer aria-disabled so TooltipTrigger asChild still receives hover/focus
            aria-disabled={isDisabled || undefined}
            style={{ width: width + 1 }}
            className={cn(
              isActive ? 'text-foreground' : 'text-foreground-light',
              index === 0 ? 'right-0' : 'left-0',
              buttonStyle(isActive),
              isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            )}
            onClick={() => {
              if (!isDisabled) onClickOption(option)
            }}
          >
            <span
              className={cn(
                'capitalize hover:text-foreground',
                isActive ? 'text-foreground' : 'text-foreground-light',
                isDisabled && 'hover:text-foreground-light'
              )}
            >
              {option}
            </span>
          </button>
        )

        if (!isDisabled || !disabledOptionTooltip) return optionButton

        return (
          <Tooltip key={`toggle_${index}`}>
            <TooltipTrigger asChild>{optionButton}</TooltipTrigger>
            <TooltipContent side="top">{disabledOptionTooltip}</TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
