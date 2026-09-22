import { cn } from 'ui'

interface TwoOptionToggleProps {
  options: any
  width?: number
  activeOption: any
  onClickOption: any
  borderOverride: string
}

const TwoOptionToggle = ({
  options,
  width = 50,
  activeOption,
  onClickOption,
  borderOverride = 'border-stronger',
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
      ></span>
      {options.map((option: any, index: number) => {
        const isActive = activeOption === option
        return (
          <button
            key={`toggle_${index}`}
            type="button"
            tabIndex={0}
            aria-pressed={isActive}
            style={{ width: width + 1 }}
            className={`
              ${isActive ? 'text-foreground' : 'text-foreground-light'}
              ${index === 0 ? 'right-0' : 'left-0'}
              ${buttonStyle(isActive)}
              cursor-pointer
            `}
            onClick={() => onClickOption(option)}
          >
            <span
              className={cn(
                'capitalize hover:text-foreground',
                isActive ? 'text-foreground' : 'text-foreground-light'
              )}
            >
              {option}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default TwoOptionToggle
