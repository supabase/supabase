import React from 'react'
import Countdown from 'react-countdown'
import { CountdownWidget } from 'ui'
import { LW8_LAUNCH_DATE } from '~/lib/constants'

const CountdownComponent = () => {
  const renderer = ({ days, hours, minutes, seconds, completed }: any) => {
    if (completed) {
      // Render a completed state
      return null
    } else {
      // Render countdown
      return <CountdownWidget days={days} hours={hours} minutes={minutes} seconds={seconds} />
    }
  }

  return <Countdown date={new Date(LW8_LAUNCH_DATE)} renderer={renderer} />
}

export default CountdownComponent
