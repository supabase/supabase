import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'
import { useParams } from 'common'
import Ticket from './Ticket'
import TicketActions from './TicketActions'
import TicketCustomizationForm from './TicketCustomizationForm'
import TicketCopy from './TicketCopy'

export default function TicketContainer() {
  const { userData } = useConfData()
  const params = useParams()
  const sharePage = !!params.username

  return (
    <div className="flex flex-col w-full items-center mx-auto max-w-2xl gap-3">
      {/* {!sharePage && <TicketCustomizationForm />} */}
      <Ticket />
      <TicketCopy sharePage={sharePage} />
      {/* {userData.username && <TicketActions username={userData.username} />} */}
    </div>
  )
}
