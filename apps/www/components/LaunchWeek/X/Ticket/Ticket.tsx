import { useState } from 'react'
import Image from 'next/image'
import { cn } from 'ui'

import Panel from '~/components/Panel'
import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'
import TicketProfile from './TicketProfile'
import TicketFooter from './TicketFooter'

export default function Ticket() {
  const { userData: user } = useConfData()
  const { golden = false, bg_image_id: bgImageId = '1' } = user
  const [imageHasLoaded, setImageHasLoaded] = useState(false)

  const fallbackImg = `/images/launchweek/lwx/tickets/lwx_ticket_bg.svg`

  const ticketBg = {
    regular: {
      background: `/images/launchweek/lwx/tickets/lwx_ticket_bg_regular.png`,
    },
    platinum: {
      background: `/images/launchweek/lwx/tickets/lwx_ticket_bg_platinum.png`,
    },
  }

  return (
    <Panel
      hasShimmer
      outerClassName="flex relative flex-col w-[300px] h-auto max-h-[480px] md:w-full md:max-w-none rounded-3xl !shadow-xl"
      innerClassName="flex relative flex-col justify-between w-full transition-colors aspect-[1/1.6] md:aspect-[1.967/1] rounded-3xl bg-[#020405] text-left text-sm"
      shimmerFromColor="hsl(var(--border-strong))"
      shimmerToColor="hsl(var(--background-default))"
    >
      <div className="absolute inset-0 h-full p-6 md:p-12 z-30 flex flex-col justify-between w-full md:h-full flex-1 overflow-hidden">
        <TicketProfile />
        <TicketFooter />
      </div>
      <Image
        src={ticketBg[golden ? 'platinum' : 'regular'].background}
        alt={`Launch Week X ticket background #${bgImageId}`}
        placeholder="blur"
        blurDataURL={fallbackImg}
        onLoad={() => setImageHasLoaded(true)}
        loading="eager"
        fill
        className={cn(
          'absolute inset-0 object-cover object-right opacity-0 transition-opacity duration-1000',
          imageHasLoaded && 'opacity-100'
        )}
        priority
        quality={100}
      />
    </Panel>
  )
}
