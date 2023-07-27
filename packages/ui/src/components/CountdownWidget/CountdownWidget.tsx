import CountdownStep from './CountdownStep'

interface CountdownWidgetProps {
  days?: string
  hours?: string
  minutes?: string
  seconds?: string
}

function CountdownWidget({ days, hours, minutes, seconds }: CountdownWidgetProps) {
  return (
    <div className="flex gap-1 items-center">
      {days !== undefined && (
        <>
          <CountdownStep value={days} unit="d" /> :
        </>
      )}
      {hours !== undefined && (
        <>
          <CountdownStep value={hours} unit="h" /> :
        </>
      )}
      {minutes !== undefined && (
        <>
          <CountdownStep value={minutes} unit="m" />
          {seconds !== undefined && ' :'}
        </>
      )}
      {seconds !== undefined && <CountdownStep value={seconds} unit="s" />}
    </div>
  )
}

export default CountdownWidget
