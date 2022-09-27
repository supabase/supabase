import { FC } from 'react'

interface Props {
  options: any
  activeOption: any
  onClickOption: any
  borderOverride: string
}

const TwoOptionToggle: FC<Props> = ({
  options,
  activeOption,
  onClickOption,
  borderOverride = 'border-gray-600 dark:border-gray-800',
}) => {
  const buttonStyle = (
    isActive: boolean
  ) => `absolute top-0 z-1 text-xs inline-flex h-full items-center justify-center font-medium
    ${
      isActive ? 'hover:text-white' : 'hover:text-gray-600'
    } dark:hover:text-white focus:z-10 focus:outline-none focus:border-blue-300 focus:ring-blue active:bg-gray-100
    transition ease-in-out duration-150`

  return (
    <div
      className={`relative border ${borderOverride} rounded-md h-8`}
      style={{ padding: 1, width: 102 }}
    >
      <span
        style={{ width: 50 }}
        aria-hidden="true"
        className={`${
          activeOption === options[1] ? 'translate-x-0' : 'translate-x-12'
        } z-0 inline-block rounded h-full bg-gray-600 dark:bg-gray-800 shadow transform transition ease-in-out duration-200 border border-gray-600 dark:border-gray-800`}
      ></span>
      {options.map((option: any, index: number) => (
        <span
          key={`toggle_${index}`}
          style={{ width: 51 }}
          className={`
              ${activeOption === option ? 'text-scale-1200' : 'text-scale-1000'} 
              ${index === 0 ? 'right-0' : 'left-0'} 
              ${buttonStyle(activeOption === option)}
              cursor-pointer
            `}
          onClick={() => onClickOption(option)}
        >
          <span className="text-color-inherit capitalize">{option}</span>
        </span>
      ))}
    </div>
  )
}

export default TwoOptionToggle
