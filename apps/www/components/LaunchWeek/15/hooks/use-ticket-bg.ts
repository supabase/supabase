import useLw15ConfData from './use-conf-data'

const LIMIT = 7

const useTicketBg = () => {
  const [state] = useLw15ConfData()

  const {
    userTicketData: { ticket_number },
  } = state

  const ticketBg = (ticket_number || 0) % LIMIT
  const formattedTicketBg = `00${ticketBg}`.slice(-3)

  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/launch-week/lw15/assets/bg/${formattedTicketBg}.png`
}

export default useTicketBg
