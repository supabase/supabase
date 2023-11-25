import Ticket from './Ticket'
import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'
import TicketActions from './TicketActions'
import TicketCustomizationForm from './TicketCustomizationForm'
import { useState } from 'react'

export default function TicketContainer() {
  const [isEditing, setIsEditing] = useState()
  const { userData } = useConfData()

  return (
    <div className="flex flex-col w-full items-center mx-auto max-w-2xl gap-3">
      <TicketCustomizationForm />
      <Ticket />
      {userData.username && <TicketActions username={userData.username} />}
    </div>
  )
}
