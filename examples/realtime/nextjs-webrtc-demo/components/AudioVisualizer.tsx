import { FC, useEffect, useRef, useState, useMemo } from 'react'
import { debounce } from 'lodash'
import { cn } from '../lib/cn'
import type { User } from '../pages/[...slug]'
import { Dog, MoreVertical, Phone, MicOff } from 'lucide-react'

interface Props {
  user: User
}

const ICONS = {
  mic: <Dog size={32} />,
}

const AudioVisualizer: FC<Props> = ({ user }) => {
  const requestRef = useRef<number>()

  const [analyser, setAnalyser] = useState<AnalyserNode | undefined>()
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false)
  // const [speakingLevel, setSpeakingLevel] = useState<number>(0)

  const animate = () => {
    analyser!.fftSize = 256
    const bufferLength = analyser!.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyser!.getByteFrequencyData(dataArray)

    let maxVal = 0

    for (let i = 0; i < dataArray.length; i++) {
      if (dataArray[i] > maxVal) {
        maxVal = dataArray[i]
      }
    }

    let percentage = (maxVal / 256) * 100

    // setSpeakingLevel(Math.floor(percentage))

    setIsSpeaking(percentage > 50 ? true : false)

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

  const mute = !user.stream?.getAudioTracks()[0].enabled

  // console.log(user.bg, user.stream?.getAudioTracks()[0])

  if (isSpeaking) {
    // console.log(user.stream?.getAudioTracks())
  }

  // console.log('user', user)

  console.log(user.bg, 'stream audio enabled', user.stream?.getAudioTracks()[0].enabled)

  return (
    <div>
      <div
        className={cn(
          'transition-all',
          isSpeaking ? 'scale-105' : 'scale-100',
          'relative',
          'border',
          user.border,
          `${user.bg}`,
          'h-20 w-20 rounded-lg',
          'shadow-md',
          user.text,
          'flex items-center justify-center text-center'
        )}
      >
        <div className={cn('w-full h-full flex items-center justify-center')}>{ICONS.mic}</div>
        {mute && (
          <>
            {/* mute icon */}
            <div
              className={cn(
                'transition-opacity',
                'bg-red-500',
                'w-5 h-5',
                'text-white',
                'absolute right-1.5 top-1.5',
                'rounded-full',
                'flex items-center justify-center',
                user.color,
                user.border
              )}
            >
              <MicOff size={12} />
            </div>
          </>
        )}
        {isSpeaking && (
          <>
            {/* talking icon */}
            <div
              className={cn(
                'transition-opacity',
                isSpeaking ? 'opacity-100' : 'opacity-0',
                'absolute right-1 top-1',
                'rounded-full',
                'w-3 h-3',
                'border',
                user['bg-strong'],
                user.color,
                user.border
              )}
            ></div>
          </>
        )}

        <div
          style={{ background: user.color }}
          className={`w-7 h-7 ${isSpeaking ? 'animate-ping' : ''} rounded-full`}
        />
      </div>
    </div>
  )
}

export default AudioVisualizer
