import { FC, useEffect, useRef, useState } from 'react'
import type { User } from '../pages/[...slug]'

interface Props {
  user: User
}

const AudioVisualizer: FC<Props> = ({ user }) => {
  const requestRef = useRef<number>()

  const [analyser, setAnalyser] = useState<AnalyserNode | undefined>()
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false)

  const animate = () => {
    analyser!.fftSize = 256
    const bufferLength = analyser!.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyser!.getByteFrequencyData(dataArray)

    setIsSpeaking(dataArray.some((el) => el > 50))

    requestRef.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    const audioCtx = new AudioContext()
    const analyser = audioCtx.createAnalyser()
    const source = audioCtx.createMediaStreamSource(user.stream!)
    source.connect(analyser)
    analyser.connect(audioCtx.destination)

    setAnalyser(analyser)

    return () => {
      analyser.disconnect()
      source.disconnect()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!analyser) return

    requestRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(requestRef.current!)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyser])

  return (
    <div
      className={[
        'h-8 w-8 bg-scale-1200 rounded-full bg-center bg-[length:50%_50%]',
        'bg-no-repeat shadow-md flex items-center justify-center',
      ].join(' ')}
      style={{
        border: `1px solid ${user.hue}`,
        background: user.color,
      }}
    >
      <div
        style={{ background: user.color }}
        className={`w-7 h-7 ${isSpeaking ? 'animate-ping' : ''} rounded-full`}
      />
    </div>
  )
}

export default AudioVisualizer
