import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'
import ConfContent from '~/components/launchweek/conf-content'

function LaunchweekPage() {
  const router = useRouter()
  const query = router.query

  const ticketNumber = query.ticketNumber?.toString()
  const defaultUserData = {
    id: query.id?.toString(),
    ticketNumber: ticketNumber ? parseInt(ticketNumber, 10) : undefined,
    name: query.name?.toString(),
    username: query.username?.toString(),
  }

  const meta_title = 'Join the Supabase Launch Week LIVE!'
  const meta_description = `Join the Supabase team & community for a week full of launches!`

  return (
    <>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: `https://supabase.com/launchweek`,
          images: [
            {
              url: `https://supabase.com${router.basePath}/images/product/database/database-og.jpg`, // TODO
            },
          ],
        }}
      />
      <ConfContent
        defaultUserData={defaultUserData}
        defaultPageState={query.ticketNumber ? 'ticket' : 'registration'}
      />
    </>
  )
}

export default LaunchweekPage
