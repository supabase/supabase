interface CountdownStepProps {
  value: string | number
  unit: string
}

function CountdownStep({ value, unit }: CountdownStepProps) {
  return (
    <div className="rounded-md p-[1px] overflow-hidden bg-gradient-to-b from-[#514b6130] to-[#514b6100]">
      <div className="py-1 px-2 rounded-md w-11 leading-4 flex items-center justify-center bg-gradient-to-b from-[#51269c40] to-[#DBB8BF10] backdrop-blur-md">
        <span className="m-0">{value}</span>
        <span>{unit}</span>
      </div>
    </div>
  )
}

export default CountdownStep
