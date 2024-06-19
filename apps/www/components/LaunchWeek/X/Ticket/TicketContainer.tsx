import { useParams } from 'common'
import Ticket from './Ticket'
import TicketCustomizationForm from './TicketCustomizationForm'
import TicketCopy from './TicketCopy'

export default function TicketContainer() {
  const params = useParams()
  const sharePage = !!params.username

  return (
    <div className="flex flex-col w-full items-center mx-auto max-w-2xl gap-3 group group-hover">
      {!sharePage && <TicketCustomizationForm className="order-last md:order-first" />}
      <Ticket />
      <div className="flex flex-col md:flex-row gap-2 items-center justify-center mx-auto max-w-full">
        <TicketCopy sharePage={sharePage} />
      </div>
    </div>
  )
}
