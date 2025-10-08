import LW15TicketPageProxy from '~/components/LaunchWeek/15/Ticketing/LW15TicketPageProxy'
import { useRouter } from 'next/router'

import { Lw15ConfDataProvider } from 'components/LaunchWeek/15/hooks/use-conf-data'
import DefaultLayout from '../../components/Layouts/Default'

const Lw15Page = () => {
  const { query } = useRouter()
  const ticketNumber = query.ticketNumber?.toString()
  const defaultUserData = {
    id: query.id?.toString(),
    ticket_number: ticketNumber ? parseInt(ticketNumber, 10) : undefined,
    name: query.name?.toString(),
    username: query.username?.toString(),
    platinum: !!query.platinum,
  }

  return (
    <Lw15ConfDataProvider initState={{ userTicketData: defaultUserData }}>
      <DefaultLayout className="!min-h-fit !h-fit lg:!min-h-[calc(100dvh-66px)] lg:!h-full dark:bg-black">
        <div
          style={{
            fontFamily:
              "SuisseIntl-Book, custom-font, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
          }}
          className="h-full"
        >
          <LW15TicketPageProxy />
        </div>
      </DefaultLayout>
    </Lw15ConfDataProvider>
  )
}

export default Lw15Page
