import { useEffect, useState } from 'react'
import Image from 'next/image'
import TicketProfile from './TicketProfile'
import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'
import TicketFooter from './TicketFooter'
import { cn } from 'ui'
import Panel from '~/components/Panel'
import { SupabaseClient } from '@supabase/supabase-js'

export default function Ticket() {
  const [realtimeChannel, setRealtimeChannel] = useState<ReturnType<
    SupabaseClient['channel']
  > | null>(null)
  const { userData: user, setUserData, supabase } = useConfData()
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

  useEffect(() => {
    // Listen to realtime changes
    if (supabase) {
      const channel = supabase
        .channel('changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'lwx_tickets',
            filter: `username=eq.${user.username}`,
          },
          (payload: any) => {
            // const golden = !!payload.new.sharedOnTwitter && !!payload.new.sharedOnLinkedIn
            setUserData({
              ...payload.new,
              golden,
            })
            // if (golden) {
            //   channel.unsubscribe()
            // }
          }
        )
        .subscribe()
      setRealtimeChannel(channel)
    }

    return () => {
      // Cleanup realtime subscription on unmount
      realtimeChannel?.unsubscribe()
    }
  }, [])

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
        quality={100}
      />
    </Panel>
  )
}
