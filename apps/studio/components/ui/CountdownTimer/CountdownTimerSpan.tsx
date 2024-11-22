import MotionNumber from 'motion-number'

interface CountdownTimerSpanProps {
  seconds: number
}

const CountdownTimerSpan = ({ seconds }: CountdownTimerSpanProps) => {
  const transitionConfig = {
    y: { type: 'spring', duration: 0.35, bounce: 0 },
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  const formatConfig = { minimumIntegerDigits: 2 }
  const formatValue = (value: number) => value.toString().padStart(2, '0')

  return (
    <span className="inline-flex gap-2">
      <span className="text-foreground-lighter text-sm p-0">Time remaining: </span>
      <span className="text-foreground text-sm font-mono flex items-center gap-0">
        <MotionNumber
          format={formatConfig}
          value={formatValue(hours)}
          transition={transitionConfig}
        />
        hr
        <MotionNumber
          format={formatConfig}
          value={formatValue(minutes)}
          transition={transitionConfig}
        />
        m
        <MotionNumber
          format={formatConfig}
          value={formatValue(remainingSeconds)}
          transition={transitionConfig}
        />
      </span>
    </span>
  )
}

export default CountdownTimerSpan
