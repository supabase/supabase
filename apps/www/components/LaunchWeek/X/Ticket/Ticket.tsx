import { useState } from 'react'
import Image from 'next/image'
import { IconEdit2, IconX, cn } from 'ui'

import Panel from '~/components/Panel'
import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'
import TicketProfile from './TicketProfile'
import TicketFooter from './TicketFooter'
import { useBreakpoint, useParams } from 'common'

export default function Ticket() {
  const { userData: user, showCustomizationForm, setShowCustomizationForm } = useConfData()
  const isMobile = useBreakpoint()
  const { golden = false, bg_image_id: bgImageId = '1', metadata } = user
  const [imageHasLoaded, setImageHasLoaded] = useState(false)
  const params = useParams()
  const sharePage = !!params.username
  const ticketType = metadata?.hasSecretTicket ? 'secret' : golden ? 'platinum' : 'regular'

  const fallbackImg = `/images/launchweek/lwx/tickets/lwx_ticket_bg_${ticketType}.png`

  const ticketBg = {
    regular: {
      background: `/images/launchweek/lwx/tickets/lwx_ticket_bg_regular.png`,
      background_mobile: `/images/launchweek/lwx/tickets/lwx_ticket_regular_mobile.png`,
    },
    platinum: {
      background: `/images/launchweek/lwx/tickets/lwx_ticket_bg_platinum.png`,
      background_mobile: `/images/launchweek/lwx/tickets/lwx_ticket_platinum_mobile.png`,
    },
    secret: {
      background: `/images/launchweek/lwx/tickets/lwx_ticket_bg_secret.png`,
      background_mobile: `/images/launchweek/lwx/tickets/lwx_ticket_secret_mobile.png`,
    },
  }

  function handleCustomizeTicket() {
    setShowCustomizationForm && setShowCustomizationForm(!showCustomizationForm)
  }

  return (
    <Panel
      hasShimmer
      outerClassName="flex relative flex-col w-[300px] h-auto max-h-[480px] md:w-full md:max-w-none rounded-3xl !shadow-xl"
      innerClassName="flex relative flex-col justify-between w-full transition-colors aspect-[1/1.6] md:aspect-[1.967/1] rounded-3xl bg-[#020405] text-left text-sm group/ticket"
      shimmerFromColor="hsl(var(--border-strong))"
      shimmerToColor="hsl(var(--background-default))"
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

      <div className="absolute inset-0 h-full p-6 md:p-10 z-30 flex flex-col justify-end md:justify-between w-full md:h-full flex-1 overflow-hidden">
        <TicketProfile />
        <TicketFooter />
      </div>
      <Image
        src={ticketBg[ticketType][!isMobile ? 'background' : 'background_mobile']}
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
  )
}
