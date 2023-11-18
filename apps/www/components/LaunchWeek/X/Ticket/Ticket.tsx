import TicketProfile from './TicketProfile'
import TicketNumber from './TicketNumber'
import { UserData } from '~/components/LaunchWeek/hooks/use-conf-data'
import Image from 'next/image'
import TicketForm from './TicketForm'
import TicketFooter from './TicketFooter'
import { cn } from 'ui'
import Panel from '../../../Panel'
import { useState } from 'react'

type TicketGenerationState = 'default' | 'loading'
type Props = {
  user: UserData
  ticketGenerationState?: TicketGenerationState
  setTicketGenerationState?: any
}

export default function Ticket({
  user,
  ticketGenerationState = 'default',
  setTicketGenerationState,
}: Props) {
  const storageBaseFilepath = `https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/lwx/assets/ai/`
  const fallbackImg = `/images/launchweek/lwx/ticktts/1.png`
  const overlay = `/images/launchweek/lwx/tickets/ticket_overlay.png`
  const { username, golden = false, bg_image_id: bgImageId = '1', ticketNumber } = user
  const [imageHasLoaded, setImageHasLoaded] = useState(false)

  const ticketBg = {
    regular: {
      background: `${storageBaseFilepath}/regular/${bgImageId}.jpg`,
    },
    golden: {
      background: `/images/launchweek/8/ticket-bg/golden.png`,
    },
  }

  const CURRENT_TICKET = golden ? 'golden' : 'regular'
  const CURRENT_TICKET_BG = ticketBg[CURRENT_TICKET].background

  return (
    <Panel
      hasShimmer
      outerClassName="flex relative flex-col w-[300px] h-auto max-h-[480px] md:w-full md:max-w-none !bg-black"
      innerClassName="flex relative flex-col justify-between w-full transition-colors aspect-[1/1.6] md:aspect-[1.935/1] rounded-xl bg-[#020405]"
    >
      {username ? (
        <>
          <div className="absolute inset-0 h-full p-6 z-30 flex flex-col items-center justify-between bg- w-full md:h-full flex-1 overflow-hidden">
            <TicketProfile
              user={user}
              ticketGenerationState={ticketGenerationState}
              setTicketGenerationState={setTicketGenerationState}
              golden={golden}
            />
            <TicketFooter user={user} />
            <Image
              src={overlay}
              alt={`Launch Week X ticket background overlay`}
              layout="fill"
              className="absolute z-2 inset-0 object-cover object-center"
            />
          </div>
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#020405] via-transparent to-[#020405]" />
          <Image
            src={CURRENT_TICKET_BG}
            alt={`Launch Week X ticket background #${bgImageId}`}
            placeholder="blur"
            blurDataURL={fallbackImg}
            onLoad={() => setImageHasLoaded(true)}
            loading="eager"
            layout="fill"
            className={cn(
              'absolute inset-0 object-cover object-center opacity-0 transition-opacity duration-1000',
              imageHasLoaded && 'opacity-100'
            )}
            quality={100}
          />
        </>
      ) : (
        <TicketForm
          defaultUsername={username ?? undefined}
          setTicketGenerationState={setTicketGenerationState}
        />
      )}
    </Panel>
  )
}
