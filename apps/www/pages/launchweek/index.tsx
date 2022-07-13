import { useState } from 'react'
import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { PageState, ConfDataContext, UserData } from '~/lib/launchweek/hooks/use-conf-data'
import Hero from '~/components/launchweek/hero'
import Form from '~/components/launchweek/form'
import supabase from '~/lib/supabase'

function LaunchweekPage() {
  const router = useRouter()

  const [userData, setUserData] = useState<UserData>({})
  const [pageState, setPageState] = useState<PageState>('registration')

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
      <ConfDataContext.Provider
        value={{
          userData,
          setUserData,
          setPageState,
        }}
      >
        <DefaultLayout>
          <SectionContainer className="space-y-12">
            <div>
              {pageState === 'registration' ? (
                <>
                  <Hero />
                  <Form />
                </>
              ) : (
                <span>TODO add ticket</span>
                // <Ticket
                //   username={userData.username}
                //   name={userData.name}
                //   ticketNumber={userData.ticketNumber}
                //   sharePage={false}
                // />
              )}
            </div>
          </SectionContainer>
        </DefaultLayout>
      </ConfDataContext.Provider>
    </>
  )
}

export default LaunchweekPage
