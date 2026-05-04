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
    } hover:text-foreground focus:z-10 focus:outline-hidden focus:border-blue-300 focus:ring-blue
    transition ease-in-out duration-150`

  return (
    <div
      className={`relative border ${borderOverride} rounded-md h-7`}
      style={{ padding: 1, width: (width + 1) * 2 }}
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
        const optionButton = (
          <span
            key={`toggle_${index}`}
            style={{ width: width + 1 }}
            className={cn(
              activeOption === option ? 'text-foreground' : 'text-foreground-light',
              index === 0 ? 'right-0' : 'left-0',
              buttonStyle(activeOption === option),
              isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            )}
            onClick={() => {
              if (!isDisabled) onClickOption(option)
            }}
          >
            <span
              className={cn(
                'capitalize hover:text-foreground',
                activeOption === option ? 'text-foreground' : 'text-foreground-light',
                isDisabled && 'hover:text-foreground-light'
              )}
            >
              {option}
            </span>
          </span>
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
