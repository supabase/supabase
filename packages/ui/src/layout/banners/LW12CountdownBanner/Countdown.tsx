import Countdown from 'react-countdown'
import { CountdownWidget } from 'ui-patterns'

const CountdownComponent = ({
  date,
  showCard = true,
}: {
  date: string | number | Date
  showCard?: boolean
}) => {
  if (!date) return null

  const renderer = ({ days, hours, minutes, seconds, completed }: any) => {
    if (completed) {
      // Render a completed state
      return null
    } else {
      // Render countdown
      return (
        <CountdownWidget
          days={days}
          hours={hours}
          minutes={minutes}
          seconds={seconds}
          showCard={showCard}
        />
      )
    }
  }

  return <Countdown date={new Date(date)} renderer={renderer} />
}

export default CountdownComponent
