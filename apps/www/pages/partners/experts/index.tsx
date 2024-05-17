import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import PartnerLinkBox from '~/components/Partners/PartnerLinkBox'
import supabase from '~/lib/supabaseMisc'
import type { Partner } from '~/types/partners'
import TileGrid from '../../../components/Partners/TileGrid'

export async function getStaticProps() {
  const { data: partners } = await supabase
    .from('partners')
    .select('*')
    .eq('approved', true)
    .eq('type', 'expert')
    .order('category')
    .order('title')

  return {
    props: {
      partners,
    },
    revalidate: 1800, // 30 minutes
  }
}

interface Props {
  partners: Partner[]
}

function ExpertPartnersPage(props: Props) {
  const partners = props.partners ?? []
  const router = useRouter()

  const meta_title = 'Find an expert'
  const meta_description = `Find an expert to help build your next idea.`

  return (
    <>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: `https://supabase.com/partners/experts`,
          images: [
            {
              url: `https://supabase.com${router.basePath}/images/product/database/database-og.jpg`, // TODO
            },
          ],
        }}
      />
      <DefaultLayout className="bg-alternative">
        <SectionContainer className="space-y-12">
          <div>
            <h1 className="h1">{meta_title}</h1>
            <p className="text-foreground-lighter text-xl">{meta_description}</p>
          </div>
          <div className="grid space-y-12 md:gap-8 lg:grid-cols-12 lg:gap-16 lg:space-y-0 xl:gap-16">
            <div className="lg:col-span-4 xl:col-span-3">
              {/* Horizontal link menu */}
              <div className="space-y-6">
                {/* Search Bar */}
                <div className="space-y-4">
                  <div className="text-foreground-light mb-2 text-sm">Explore more</div>
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
                    <PartnerLinkBox
                      title="Integrations"
                      color="blue"
                      description="Extend and automate your workflow by using integrations for your favorite tools."
                      href={`/partners/integrations`}
                      icon={
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="1"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                          />
                        </svg>
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-8 xl:col-span-9">
              {/* Partner Tiles */}
              <div className="grid">
                {partners.length ? (
                  <TileGrid partners={partners} hideCategories={true} />
                ) : (
                  <p className="h2">No Partners Found</p>
                )}
              </div>
            </div>
          </div>
        </SectionContainer>
      </DefaultLayout>
    </>
  )
}

export default ExpertPartnersPage
