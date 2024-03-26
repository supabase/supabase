import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { IconEdit2, IconX, cn } from 'ui'
import Tilt from 'vanilla-tilt'

import Panel from '~/components/Panel'
import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'
import TicketProfile from './TicketProfile'
import { useBreakpoint, useParams } from 'common'

export default function Ticket() {
  const ticketRef = useRef<HTMLDivElement>(null)
  const { userData: user, showCustomizationForm, setShowCustomizationForm } = useConfData()
  const isMobile = useBreakpoint()
  const { golden = false, bg_image_id: bgImageId = '1', metadata, secret: hasSecretTicket } = user
  const [imageHasLoaded, setImageHasLoaded] = useState(false)
  const params = useParams()
  const sharePage = !!params.username
  const ticketType = hasSecretTicket ? 'secret' : golden ? 'platinum' : 'regular'

  const fallbackImg = `/images/launchweek/11_ga/tickets/lw11_ticket_${ticketType}.png`

  const ticketBg = {
    regular: {
      background: `/images/launchweek/11_ga/tickets/lw11_ticket_regular_darker.png`,
      background_mobile: `/images/launchweek/11_ga/tickets/lw11_ticket_regular_darker.png`,
    },
    platinum: {
      background: `/images/launchweek/11_ga/tickets/lw11_ticket_platinum.png`,
      background_mobile: `/images/launchweek/11_ga/tickets/lw11_ticket_platinum.png`,
    },
    secret: {
      background: `/images/launchweek/11_ga/tickets/lw11_ticket_gold.png`,
      background_mobile: `/images/launchweek/11_ga/tickets/lw11_ticket_gold.png`,
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
      className="w-auto h-auto flex justify-center rounded-xl overflow-hidden will-change-transform"
      style={{ transformStyle: 'preserve-3d', transform: 'perspective(1000px)' }}
    >
      <Panel
        hasShimmer
        outerClassName="flex relative flex-col w-[360px] h-auto max-h-[680px] rounded-3xl !shadow-xl !p-0"
        innerClassName="flex relative flex-col justify-between w-full transition-colors aspect-[396/613] rounded-xl bg-[#020405] text-left text-sm group/ticket"
        shimmerFromColor="hsl(var(--border-strong))"
        shimmerToColor="hsl(var(--background-default))"
        style={{ transform: 'translateZ(-10px)' }}
      >
        {/* Edit hover button */}
        {!sharePage && (
          <>
            <button
              className="absolute z-40 inset-0 w-full h-full outline-none"
              onClick={handleCustomizeTicket}
            />
            <div className="hidden md:flex opacity-0 translate-y-3 group-hover/ticket:opacity-100 group-hover/ticket:translate-y-0 transition-all absolute z-30 inset-0 m-auto w-10 h-10 rounded-full items-center justify-center bg-[#020405] border shadow-lg text-foreground">
              {!showCustomizationForm ? <IconEdit2 className="w-4" /> : <IconX className="w-4" />}
            </div>
          </>
        )}

        <div className="absolute inset-0 h-full p-6 top-20 bottom-20 z-30 flex flex-col justify-between w-full flex-1 overflow-hidden">
          <TicketProfile />
          {/* <TicketFooter /> */}
        </div>
        <Image
          src={ticketBg[ticketType].background}
          alt={`Launch Week X ticket background #${bgImageId}`}
          placeholder="blur"
          blurDataURL={fallbackImg}
          onLoad={() => setImageHasLoaded(true)}
          loading="eager"
          fill
          className={cn(
            'absolute inset-0 object-cover object-right opacity-0 transition-opacity duration-1000',
            imageHasLoaded && 'opacity-100',
            isMobile && 'object-left-top'
          )}
          priority
          quality={100}
        />
      </Panel>
    </div>
  )
}
