import { NextSeo } from 'next-seo'
import { LwCanvas } from '~/components/LaunchWeek/14/canvas'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { LW14_DATE, LW14_TITLE, LW14_URL, SITE_ORIGIN } from '~/lib/constants'

const Lw14Page = () => {
  const TITLE = `${LW14_TITLE} | ${LW14_DATE}`
  const DESCRIPTION = 'Join us for a week of announcing new features, every day at 7 AM PT.'
  const OG_IMAGE = `${SITE_ORIGIN}/images/launchweek/14/lw14-og.png?lw=14`

  return (
    <>
      <NextSeo
        title={TITLE}
        description={DESCRIPTION}
        openGraph={{
          title: TITLE,
          description: DESCRIPTION,
          url: LW14_URL,
          images: [
            {
              url: OG_IMAGE,
            },
          ],
        }}
      />
      <DefaultLayout>
        <SectionContainer
          id="ticket"
          className="relative !max-w-none lw-nav-anchor"
        >
          <LwCanvas />
        </SectionContainer>
      </DefaultLayout>
    </>
  )
}

export default Lw14Page
