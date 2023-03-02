import React from 'react'
import TicketHeader from '../Ticket/TicketHeader'
import TicketNumber from '../Ticket/TicketNumber'
import { UserData } from '../Ticket/hooks/use-conf-data'

interface Props {
  user: UserData
}

export function TicketBrick({ user }: Props) {
  const golden = user.sharedOnLinkedIn && user.sharedOnTwitter
  console.log(user)
  return (
    <div
      key={user.name}
      className={[
        'relative w-[450px] h-[230px] border border-red-100 rounded-2xl',
        golden
          ? 'bg-[url("/images/launchweek/seven/bg-ticket-purple.png")]'
          : 'bg-[url("/images/launchweek/seven/bg-ticket-gold.png")]',
      ].join(' ')}
    >
      <TicketHeader size="small" />
      <div className="rounded-full grid gap-4 mx-auto justify-center mt-8">
        <img
          src={`https://github.com/${user.username}.png`}
          alt={user.username}
          className="w-20 h-20 rounded-full"
        />
        <div className="text-center">
          <h3 className="gradient-text-scale-100 text-xl">
            {user.name ? user.name : user.username}
          </h3>
          {user.name && <p className="gradient-text-scale-100 text-sm">@{user.username}</p>}
        </div>
      </div>
      <TicketNumber number={user.ticketNumber} size="small" />
    </div>
  )
}
