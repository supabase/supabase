const sizes = {
  md: {
    slider: 'h-5 w-5',
    toggleOn: 'translate-x-5',
    toggleOff: 'translate-x-0',
    background: 'h-6 w-11 border-2',
  },
  sm: {
    slider: 'h-4 w-4',
    toggleOn: 'translate-x-3',
    toggleOff: 'translate-x-0',
    background: 'h-5 w-9 border-2',
  },
}

export default function Toggle({
  isOn = true,
  size = 'md',
  onToggle = (value) => {},
  isDisabled = false,
}) {
  const toggleSizes = sizes[size]
  return (
    <span
      role="checkbox"
      aria-checked="false"
      onClick={!isDisabled ? () => onToggle(!isOn) : () => {}}
      className={`${isOn ? 'bg-green-500' : 'bg-gray-200'} ${toggleSizes.background} ${
        isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
      } relative inline-block flex-shrink-0 border-transparent rounded-full transition-colors ease-in-out duration-200 focus:outline-none focus:ring `}
    >
      <span
        aria-hidden="true"
        className={`${isOn ? toggleSizes.toggleOn : toggleSizes.toggleOff} ${
          isDisabled ? 'cursor-not-allowed bg-white' : 'cursor-pointer bg-white'
        }  ${
          toggleSizes.slider
        } inline-block rounded-full shadow transform transition ease-in-out duration-200`}
      ></span>
    </span>
  )
}
