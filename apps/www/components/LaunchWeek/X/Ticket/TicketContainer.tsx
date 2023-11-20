import { SupabaseClient } from '@supabase/supabase-js'
import Ticket from './Ticket'
import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'
import TicketActions from './TicketActions'

type Props = {
  supabase: SupabaseClient | null
}

export default function TicketContainer({ supabase }: Props) {
  const { userData } = useConfData()

  return (
    <div className="flex flex-col w-full justify-center mx-auto max-w-2xl gap-3">
      <Ticket />
      {userData.username && <TicketActions username={userData.username} />}
    </div>
  )
}
