import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { Badge } from 'ui'
import useConfData from '../hooks/use-conf-data'

export interface Meetup {
  id?: any
  title: string
  isLive: boolean
  link: string
  display_info: string
  start_at: string
}

const LW8Meetups = ({ meetups }: { meetups?: Meetup[] }) => {
  const { supabase } = useConfData()
  const [meets, setMeets] = useState<Meetup[]>(meetups ?? [])
  const [realtimeChannel, setRealtimeChannel] = useState<ReturnType<
    (typeof supabase)['channel']
  > | null>(null)

  useEffect(() => {
    // Listen to realtime changes
    if (supabase && !realtimeChannel) {
      const channel = supabase
        .channel('changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'lw8_meetups',
          },
          async () => {
            const { data: newMeets } = await supabase.from('lw8_meetups').select('*')
            setMeets(newMeets)
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
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8">
      <div className="col-span-1 lg:col-span-4 flex flex-col justify-center">
        <h2 className="text-2xl sm:text-3xl xl:text-4xl tracking-[-.5px]">Join us live</h2>
        <p className="text-scale-1000 text-xs sm:text-sm lg:text-base py-3 lg:max-w-md">
          Celebrate LW8 with us at our first-ever live meetups across various locations. Join the
          fun, grab some swag, and be a part of the Supabase community.
        </p>
      </div>
      <div className="col-span-1 lg:col-span-7 lg:col-start-6 w-full max-w-4xl flex flex-col justify-between items-stretch">
        {meets &&
          meets
            ?.sort((a, b) => (new Date(a.start_at) > new Date(b.start_at) ? 1 : -1))
            .map(({ display_info, link, isLive, title }: Meetup) => (
              <Link href={link ?? '#'}>
                <a
                  target="_blank"
                  className={[
                    'w-full group py-0 flex items-center gap-2 md:gap-4 text-lg sm:text-2xl lg:text-4xl border-b border-[#111718]',
                    'hover:text-brand',
                    isLive ? 'text-scale-1100' : 'text-scale-800',
                    !link && 'pointer-events-none',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2 md:gap-4">
                    <span>{title}</span>
                    {isLive && <Badge>Live now</Badge>}
                    <span className="opacity-0 -translate-x-2 transition-all md:group-hover:opacity-100 group-hover:translate-x-0">
                      <svg
                        width="47"
                        height="47"
                        viewBox="0 0 47 47"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M33.0387 16.2422L40.6691 23.8727M40.6691 23.8727L33.0387 31.5031M40.6691 23.8727L6.33203 23.8727"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </div>
                  {display_info && (
                    <span className="text-sm text-right flex-1">{display_info}</span>
                  )}
                </a>
              </Link>
            ))}
      </div>
    </div>
  )
}

export default LW8Meetups
