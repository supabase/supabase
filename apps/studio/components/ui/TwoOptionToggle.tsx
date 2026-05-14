import { cn } from 'ui'

interface TwoOptionToggleProps {
  options: string[]
  width?: number
  activeOption: string
  onClickOption: (value: string) => void
  borderOverride: string
}

export const TwoOptionToggle = ({
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
      {options.map((option, index: number) => (
        <span
          key={`toggle_${index}`}
          style={{ width: width + 1 }}
          className={`
              ${activeOption === option ? 'text-foreground' : 'text-foreground-light'}
              ${index === 0 ? 'right-0' : 'left-0'}
              ${buttonStyle(activeOption === option)}
              cursor-pointer
            `}
          onClick={() => onClickOption(option)}
        >
          <span
            className={cn(
              'capitalize hover:text-foreground',
              activeOption === option ? 'text-foreground' : 'text-foreground-light'
            )}
          >
            {option}
          </span>
        </span>
      ))}
    </div>
  )
}
