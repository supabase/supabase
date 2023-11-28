import Link from 'next/link'
import React from 'react'
import { Button } from 'ui'
import { LWX_LAUNCH_DATE } from '../../../lib/constants'

const AddToCalendar = () => {
  const eventTitle = 'Supabase Launch Week X'
  const timestampDate = ''
  const link = encodeURI(
    `https://calendar.google.com/calendar/render?action=TEMPLATE&dates=${timestampDate}%${timestampDate}&text=${eventTitle}`
  )

  return (
    <Button size="tiny" type="outline" className="mt-1 py-1 px-2 leading-none" asChild>
      <Link href={link} target="_blank">
        Add to calendar
      </Link>
    </Button>
  )
}

export default AddToCalendar
