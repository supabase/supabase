interface CountdownStepProps {
  value: string | number
  unit: string
  showCard?: boolean
}

function CountdownStep({ value, unit, showCard = true }: CountdownStepProps) {
  return (
    <div
      className={[
        showCard
          ? 'rounded-md p-[1px] overflow-hidden bg-gradient-to-b from-[#514b6130] to-[#514b6100]'
          : '',
      ].join(' ')}
    >
      <div
        className={[
          showCard
            ? 'py-1 px-2 rounded-md w-11 leading-4 flex items-center justify-center bg-gradient-to-b from-[#51269c40] to-[#DBB8BF10] backdrop-blur-md'
            : 'flex items-center justify-center w-9 py-1 px-1',
        ].join(' ')}
      >
        <span className="m-0">{value}</span>
        <span>{unit}</span>
      </div>
    </div>
  )
}

export default CountdownStep
