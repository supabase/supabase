import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { cn } from 'ui'
import { Pencil, X } from 'lucide-react'
import Tilt from 'vanilla-tilt'
import { useBreakpoint, useParams } from 'common'

import Panel from '~/components/Panel'
import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'
import TicketProfile from './TicketProfile'
import TicketCustomizationForm from './TicketCustomizationForm'
import TicketNumber from './TicketNumber'

export default function Ticket() {
  const ticketRef = useRef<HTMLDivElement>(null)
  const { userData: user, showCustomizationForm, setShowCustomizationForm } = useConfData()
  const isMobile = useBreakpoint()
  const {
    platinum = false,
    bg_image_id: bgImageId = '1',
    secret: hasSecretTicket,
    ticketNumber,
  } = user
  const [imageHasLoaded, setImageHasLoaded] = useState(false)
  const params = useParams()
  const sharePage = !!params.username
  const ticketType = hasSecretTicket ? 'secret' : platinum ? 'platinum' : 'regular'

  const fallbackImg = `/images/launchweek/11/tickets/shape/lw11_ticket_${ticketType}.png`

  const ticketBg = {
    regular: {
      background: `/images/launchweek/11/tickets/shape/lw11_ticket_regular.png`,
    },
    platinum: {
      background: `/images/launchweek/11/tickets/shape/lw11_ticket_platinum.png`,
    },
    secret: {
      background: `/images/launchweek/11/tickets/shape/lw11_ticket_purple.png`,
    },
  }

  function handleCustomizeTicket() {
    setShowCustomizationForm && setShowCustomizationForm(!showCustomizationForm)
  }

  useEffect(() => {
    if (ticketRef.current && !window.matchMedia('(pointer: coarse)').matches) {
      Tilt.init(ticketRef.current, {
        glare: true,
        max: 3,
        gyroscope: true,
        'max-glare': 0.2,
        'full-page-listening': true,
      })
    }
  }, [ticketRef])

  return (
    <div
      ref={ticketRef}
      className="relative w-auto h-auto flex justify-center rounded-xl overflow-hidden will-change-transform"
      style={{ transformStyle: 'preserve-3d', transform: 'perspective(1000px)' }}
    >
      <Panel
        hasShimmer
        outerClassName="flex relative flex-col w-[360px] h-auto max-h-[680px] rounded-3xl !shadow-xl !p-0"
        innerClassName="flex relative flex-col justify-between w-full transition-colors aspect-[396/613] rounded-xl dark:bg-[#020405] text-left text-sm group/ticket"
        shimmerFromColor="hsl(var(--border-strong))"
        shimmerToColor="hsl(var(--background-default))"
        style={{ transform: 'translateZ(-10px)' }}
      >
        <TicketNumber
          number={ticketNumber}
          platinum={platinum}
          secret={hasSecretTicket}
          className="absolute z-20 top-6 left-6"
        />
        <TicketProfile className="absolute inset-0 h-full p-6 top-20 bottom-20 z-30 flex flex-col justify-between w-full flex-1 overflow-hidden" />
        <Image
          src={ticketBg[ticketType].background}
          alt={`Launch Week X ticket background #${bgImageId}`}
          placeholder="blur"
          blurDataURL={fallbackImg}
          onLoad={() => setImageHasLoaded(true)}
          loading="eager"
          fill
          sizes="100%"
          className={cn(
            'absolute inset-0 object-cover object-right opacity-0 transition-opacity duration-1000',
            imageHasLoaded && 'opacity-100',
            isMobile && 'object-left-top'
          )}
          priority
          quality={100}
        />
        {/* Edit hover button */}
        {!sharePage && (
          <>
            <button
              className="absolute z-40 inset-0 w-full h-full outline-none"
              onClick={handleCustomizeTicket}
            />
            <div className="flex md:translate-y-3 opacity-100 md:opacity-0 group-hover/ticket:opacity-100 group-hover/ticket:md:translate-y-0 transition-all absolute z-30 right-4 top-4 md:inset-0 m-auto w-10 h-10 rounded-full items-center justify-center bg-surface-100 dark:bg-[#020405] border shadow-lg text-foreground">
              {!showCustomizationForm ? <Pencil className="w-4" /> : <X className="w-4" />}
            </div>
          </>
        )}
      </Panel>
      <div className="absolute top-0 left-auto right-auto mx-auto w-[20%] aspect-square -translate-y-[65%] dark:bg-[#060809] z-40 rounded-b-[100px]" />
      {!sharePage && (
        <TicketCustomizationForm className="absolute inset-0 top-auto z-40 order-last md:order-first" />
      )}
    </div>
  )
}
