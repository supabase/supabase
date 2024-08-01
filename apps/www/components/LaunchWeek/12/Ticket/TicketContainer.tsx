import { Badge } from 'ui'
import Ticket from './Ticket'
import useConfData from '../../hooks/use-conf-data'

export default function TicketContainer() {
  const { userData } = useConfData()

  const hasSecretTicket = userData.secret
  const hasPlatinumTicket = userData.platinum && !hasSecretTicket

  return (
    <div className="flex flex-col w-full items-center mx-auto max-w-xl gap-3 group group-hover">
      {hasSecretTicket && <Badge variant="outline">Secret ticket</Badge>}
      {hasPlatinumTicket && <Badge variant="outline">Platinum ticket</Badge>}
      <Ticket />
    </div>
  )
}
