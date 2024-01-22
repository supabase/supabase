import React, { useState } from 'react'
import TicketHeader from '../Ticket/TicketHeader'
import TicketNumber from '../Ticket/TicketNumber'
import { UserData } from '~/components/LaunchWeek/hooks/use-conf-data'
import Image from 'next/image'

interface Props {
  user: UserData
}

export function TicketBrick({ user }: Props) {
  const [isLoading, setLoading] = useState(true)

  const golden = user.sharedOnLinkedIn && user.sharedOnTwitter

  // reg_bg_57.png
  const baseImagePath = `https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/lw7/tickets_bg/`

  const randomNumber = Math.floor(Math.random() * 200) + 1
  const goldRandomNumber = Math.floor(Math.random() * 56) + 1

  return (
    <>
      <div
        key={user.name}
        className="relative w-[450px] h-[230px] border border-red-100 rounded-2xl overflow-hidden"
      >
        <Image
          src={
            golden
              ? `${baseImagePath}/reg_bg_${randomNumber}.png`
              : `${baseImagePath}/gold/gold_bg_${goldRandomNumber}.png`
          }
          layout="fill"
          objectFit="cover"
          className={[
            'duration-700 ease-in-out',
            isLoading ? 'grayscale blur-2xl scale-110' : 'grayscale-0 blur-0 scale-100',
          ].join(' ')}
          onLoadingComplete={() => setLoading(false)}
          alt=""
        />
        <div className="z-20 relative">
          <TicketHeader size="small" />
          <div className="rounded-full grid gap-4 mx-auto justify-center mt-8">
            <img
              src={`https://github.com/${user.username}.png`}
              alt={user.username}
              className="w-20 h-20 rounded-full mx-auto"
            />
            <div className="text-center">
              <h3 className="gradient-text-100 text-xl">{user.name ? user.name : user.username}</h3>
              {user.name && <p className="gradient-text-100 text-sm">@{user.username}</p>}
            </div>
          </div>
          <TicketNumber number={user.ticketNumber} size="small" />
        </div>
      </div>
    </>
  )
}
