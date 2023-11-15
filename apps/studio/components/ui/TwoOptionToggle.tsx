import clsx from 'clsx'

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
    } hover:text-foreground focus:z-10 focus:outline-none focus:border-blue-300 focus:ring-blue
    transition ease-in-out duration-150`

  return (
    <div
      className={`relative border ${borderOverride} rounded-md h-7`}
      style={{ padding: 1, width: (width + 1) * 2 }}
    >
      <span
        style={{ width, translate: activeOption === options[1] ? '0px' : `${width - 2}px` }}
        aria-hidden="true"
        className={clsx(
          'z-0 inline-block rounded h-full bg-overlay-hover shadow transform',
          'transition-all ease-in-out border border-strong'
        )}
      ></span>
      {options.map((option: any, index: number) => (
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
            className={clsx(
              'capitalize hover:text-foreground dark:hover:text-foreground',
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

export default TwoOptionToggle
