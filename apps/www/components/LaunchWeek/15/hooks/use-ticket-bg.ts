const LIMIT = 7

const useTicketBg = (ticketNumber: number = 0) => {
  const ticketBg = ((ticketNumber || 0) % LIMIT) + 1
  const formattedTicketBg = `00${ticketBg}`.slice(-3)

  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/launch-week/lw15/assets/bg/${formattedTicketBg}.png`
}

export default useTicketBg
