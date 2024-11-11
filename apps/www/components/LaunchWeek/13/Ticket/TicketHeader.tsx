import React from 'react'

interface Props {
  golden?: boolean
}

export default function TicketHeader({ golden = false }: Props) {
  return (
    <div className="relative z-10 w-full inline-flex mt-4 md:mt-6 h-10 font-mono uppercase">
      Launch Week X
    </div>
  )
}
