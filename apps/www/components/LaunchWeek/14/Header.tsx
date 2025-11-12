import { ReactNode, useEffect, useState } from 'react'
import { cn } from 'ui'
import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'

export const TicketHeader = ({ children, hidden }: { children: ReactNode; hidden?: boolean }) => {
  if (hidden) return null

  return (
    <SectionContainerWithCn
      height="none"
      className="grid lg:grid-cols-[127px_1fr_127px] grid-cols-[1fr_1fr] w-full justify-between gap-6 md:gap-8 px-0"
    >
      {children}
    </SectionContainerWithCn>
  )
}

const SingleTick = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        'w-px h-2.5 bg-neutral-500 shadow-[0px_0px_4px_0px_rgba(255,255,255,0.25)]',
        className
      )}
    />
  )
}

export const TicketHeaderClaim = () => {
  return (
    <div className="inline-flex justify-start items-center gap-8 w-full order-1 col-span-2 lg:col-auto lg:order-2">
      <div className="hidden gap-4 flex-wrap w-full h-2.5 overflow-hidden justify-end flex-shrink flex-1 md:flex">
        {Array.from({ length: 7 }).map((_, i) => (
          <SingleTick key={i} />
        ))}
      </div>
      <div className="text-start md:text-center justify-center text-neutral-500 text-sm font-normal uppercase [text-shadow:_0px_0px_4px_rgb(255_255_255_/_0.25)] lg:text-nowrap flex-grow max-w-[220px] md:max-w-none">
        Launch Week is coming. Stay tuned!
      </div>
      <div className="hidden gap-4 flex-wrap w-full h-2.5 overflow-hidden flex-shrink flex-1 md:flex">
        {Array.from({ length: 7 }).map((_, i) => (
          <SingleTick key={i} />
        ))}
      </div>
    </div>
  )
}

interface TicketHeaderRemainingTimeProps {
  targetDate: string | Date
}

export const TicketHeaderRemainingTime = ({
  targetDate: extTargetDate,
}: TicketHeaderRemainingTimeProps) => {
  const [timeLeft, setTimeLeft] = useState<string>('---------------')

  useEffect(() => {
    const calculateTimeLeft = () => {
      const targetDate = new Date(extTargetDate)
      const now = new Date()

      // Calculate the time difference in milliseconds
      const difference = targetDate.getTime() - now.getTime()

      if (difference <= 0) {
        setTimeLeft('00D:00H:00M:00S')
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      // Format the time left
      setTimeLeft(
        `${days.toString().padStart(2, '0')}D:${hours.toString().padStart(2, '0')}H:${minutes
          .toString()
          .padStart(2, '0')}M:${seconds.toString().padStart(2, '0')}S`
      )
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [extTargetDate])

  return (
    <div className="flex-1 order-2 lg:order-1">
      <div className="text-justify justify-center text-emerald-400 text-sm font-normal uppercase">
        {timeLeft}
      </div>
      <div className="text-neutral-500 text-justify justify-center text-xs font-normal uppercase">
        TIME LEFT
      </div>
    </div>
  )
}

export const TicketHeaderDate = () => {
  const [time, setTime] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, '0')
      const minutes = now.getMinutes().toString().padStart(2, '0')
      const seconds = now.getSeconds().toString().padStart(2, '0')
      setTime(`${hours}:${minutes}:${seconds}`)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex-1 order-3 lg:order-3">
      <div className="text-end text-neutral-500 text-sm font-normal uppercase [text-shadow:_0px_0px_4px_rgb(255_255_255_/_0.25)]">
        {time}
      </div>

      <div className="text-end text-neutral-500 text-xs font-normal uppercase [text-shadow:_0px_0px_4px_rgb(255_255_255_/_0.25)] text-nowrap">
        LOCAL TIME
      </div>
    </div>
  )
}
