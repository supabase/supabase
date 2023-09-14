import CountdownStep from './CountdownStep'

interface CountdownWidgetProps {
  days?: string
  hours?: string
  minutes?: string
  seconds?: string
  showCard?: boolean
}

function CountdownWidget({ days, hours, minutes, seconds, showCard = true }: CountdownWidgetProps) {
  return (
    <div className="flex gap-1 items-center">
      {days !== undefined && (
        <>
          <CountdownStep value={days} unit="d" showCard={showCard} /> :
        </>
      )}
      {hours !== undefined && (
        <>
          <CountdownStep value={hours} unit="h" showCard={showCard} /> :
        </>
      )}
      {minutes !== undefined && (
        <>
          <CountdownStep value={minutes} unit="m" showCard={showCard} />
          {seconds !== undefined && ' :'}
        </>
      )}
      {seconds !== undefined && <CountdownStep value={seconds} unit="s" showCard={showCard} />}
    </div>
  )
}

export default CountdownWidget
