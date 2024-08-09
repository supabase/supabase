import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { cn } from 'ui'
import useConfData from '../hooks/use-conf-data'
import { SupabaseClient } from '@supabase/supabase-js'
import { ArrowRight } from 'lucide-react'

export interface Meetup {
  id?: any
  country?: any
  start_at: string
  title: string
  is_live: boolean
  link: string
  display_info: string
}

function addHours(start_at: Date, hours: number) {
  const dateCopy = new Date(start_at)
  dateCopy.setHours(dateCopy.getHours() + hours)

  return dateCopy
}

const LWMeetups = ({ meetups, className }: { meetups?: Meetup[]; className?: string }) => {
  const { supabase } = useConfData()
  const now = new Date(Date.now())
  const [meets, setMeets] = useState<Meetup[]>(meetups ?? [])
  const [realtimeChannel, setRealtimeChannel] = useState<ReturnType<
    SupabaseClient['channel']
  > | null>(null)
  const [activeMeetup, setActiveMeetup] = useState<Meetup>(meets[0])

  useEffect(() => {
    // Listen to realtime changes
    if (supabase && !realtimeChannel) {
      const channel = supabase
        .channel('meetups')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'meetups',
            filter: undefined,
          },
          async () => {
            const { data: newMeets } = await supabase
              .from('meetups')
              .select('*')
              .eq('launch_week', 'lw12')
              .neq('is_published', false)

            setMeets(
              newMeets?.sort((a, b) => (new Date(a.start_at) > new Date(b.start_at) ? 1 : -1))!
            )
          }
        )
        .subscribe(async (status) => {
          if (status !== 'SUBSCRIBED') {
            return null
          }
        })
      setRealtimeChannel(channel)
    }

    return () => {
      // Cleanup realtime subscription on unmount
      realtimeChannel?.unsubscribe()
    }
  }, [])

  function handleSelectMeetup(meetup: Meetup) {
    setActiveMeetup(meetup)
  }

  return (
    <div
      className={cn(
        'max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8 text-foreground-lighter',
        className
      )}
    >
      <div className="mb-4 col-span-1 xl:col-span-4 flex flex-col max-w-lg">
        <h2 className="text-sm font-mono uppercase tracking-[1px] mb-4">Community meetups</h2>
        <p className="text-base xl:max-w-md mb-2">
          Join our live community-driven meetups for Launch Week 12.
        </p>
      </div>
      <div className="col-span-1 xl:col-span-7 xl:col-start-6 w-full max-w-4xl flex flex-wrap gap-x-2 md:gap-x-3 gap-y-1">
        {meets &&
          meets
            // ?.sort((a, b) => (new Date(a.start_at) > new Date(b.start_at) ? 1 : -1))
            .map((meetup: Meetup, i: number) => {
              const startAt = new Date(meetup.start_at)
              const endAt = addHours(new Date(meetup.start_at), 3)
              const after = now > startAt
              const before3H = now < endAt
              const liveNow = after && before3H

              return (
                <>
                  {/* <button
                    key={meetup.id}
                    onClick={() => handleSelectMeetup(meetup)}
                    onMouseDown={() => handleSelectMeetup(meetup)}
                    title={liveNow ? 'Live now' : undefined}
                    className={cn(
                      'h-10 group inline-flex md:hidden items-center flex-wrap text-3xl',
                      'text-foreground-muted hover:!text-foreground !leading-none transition-colors',
                      meetup.id === activeMeetup?.id && '!text-foreground',
                      liveNow && 'text-foreground-light'
                    )}
                  >
                    {liveNow && (
                      <div className="w-2 h-2 rounded-full bg-brand mr-2 mb-4 animate-pulse" />
                    )}
                    <span>{meetup.title}</span>
                    {i !== meets.length - 1 && ', '}
                  </button> */}
                  <Link
                    key={`meetup-link-${meetup.id}`}
                    href={meetup.link ?? ''}
                    target="_blank"
                    onClick={() => handleSelectMeetup(meetup)}
                    onMouseOver={() => handleSelectMeetup(meetup)}
                    title={liveNow ? 'Live now' : undefined}
                    className={cn(
                      'h-10 group inline-flex items-center flex-wrap text-3xl md:text-4xl',
                      'text-foreground-muted hover:!text-foreground !leading-none transition-colors',
                      meetup.id === activeMeetup?.id && '!text-foreground',
                      liveNow && 'text-foreground-light'
                    )}
                  >
                    {liveNow && (
                      <div className="w-2 h-2 rounded-full bg-brand mr-2 mb-4 animate-pulse" />
                    )}
                    <span>{meetup.title}</span>
                  </Link>
                  {i !== meets.length - 1 && (
                    <span className="ml-0 bg-foreground-muted text-4xl my-auto h-1 w-1 rounded-full flex" />
                  )}
                </>
              )
            })}
      </div>
      {/* <Link
        href={activeMeetup?.link ?? '#'}
        target="_blank"
        className="col-span-1 xl:col-span-7 xl:col-start-6 w-full max-w-4xl text-sm flex-1 inline-flex flex-wrap items-center gap-1"
      >
        {activeMeetup?.display_info}{' '}
        <span className="inline">
          <ArrowRight className="w-3 md:hidden" />
        </span>
      </Link> */}
    </div>
  )
}

export default LWMeetups
