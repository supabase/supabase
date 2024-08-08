import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { IconLoader, IconSearch, Input } from 'ui'
import { useDebounce } from 'use-debounce'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import BecomeAPartner from '~/components/Partners/BecomeAPartner'
import PartnerLinkBox from '~/components/Partners/PartnerLinkBox'
import supabase from '~/lib/supabaseMisc'
import type { Partner } from '~/types/partners'
import TileGrid from '../../../components/Partners/TileGrid'

export async function getStaticProps() {
  const { data: partners } = await supabase
    .from('partners')
    .select('*')
    .eq('approved', true)
    .eq('type', 'technology')
    .order('category')
    .order('title')

  return {
    props: {
      partners,
    },
    // TODO: consider using Next.js' On-demand Revalidation with Supabase Database Webhooks instead
    revalidate: 1800, // 30 minutes
  }
}

interface Props {
  partners: Partner[]
}

function IntegrationPartnersPage(props: Props) {
  const initialPartners = props.partners ?? []
  const [partners, setPartners] = useState(initialPartners)

  const allCategories = Array.from(new Set(initialPartners?.map((p) => p.category)))

  const router = useRouter()

  const meta_title = 'Find an Integration'
  const meta_description = `Use your favorite tools with Supabase.`

  const [search, setSearch] = useState('')
  const [debouncedSearchTerm] = useDebounce(search, 300)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const searchPartners = async () => {
      setIsSearching(true)

      let query = supabase
        .from('partners')
        .select('*')
        .eq('approved', true)
        .order('category')
        .order('title')

      if (search.trim()) {
        query = query.textSearch('tsv', `${search.trim()}`, {
          type: 'websearch',
          config: 'english',
        })
      }

      const { data: partners } = await query

      return partners
    }

    if (search.trim() === '') {
      setIsSearching(false)
      setPartners(initialPartners)
      return
    }

    searchPartners().then((partners) => {
      if (partners) {
        setPartners(partners)
      }

      setIsSearching(false)
    })
  }, [debouncedSearchTerm, router])

  return (
    <>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: `https://supabase.com/partners/integrations`,
          images: [
            {
              url: `https://supabase.com${router.basePath}/images/og/integrations.png`, // TODO
            },
          ],
        }}
      />
      <DefaultLayout className="bg-alternative">
        <SectionContainer className="space-y-16">
          <div>
            <h1 className="h1">{meta_title}</h1>
            <p className="text-foreground-lighter text-xl">{meta_description}</p>
          </div>
          {/* Title */}
          <div className="grid space-y-12 md:gap-8 lg:grid-cols-12 lg:gap-16 lg:space-y-0 xl:gap-16">
            <div className="lg:col-span-4 xl:col-span-3">
              {/* Horizontal link menu */}
              <div className="space-y-6">
                {/* Search Bar */}

                <Input
                  size="small"
                  icon={<IconSearch />}
                  placeholder="Search..."
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  actions={
                    isSearching && (
                      <span className="mr-1 animate-spin text-white">
                        <IconLoader />
                      </span>
                    )
                  }
                />
                <div className="hidden lg:block">
                  <div className="text-foreground-lighter mb-2 text-sm">Categories</div>
                  <div className="space-y-1">
                    {allCategories.map((category) => (
                      <button
                        key={category}
                        onClick={() => router.push(`#${category.toLowerCase()}`)}
                        className="text-foreground-light block text-base"
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="text-foreground-lighter mb-2 text-sm">Explore more</div>
                  <div className="grid grid-cols-2 gap-8 lg:grid-cols-1">
                    <PartnerLinkBox
                      title="Experts"
                      color="blue"
                      description="Explore our certified Supabase agency experts that build with Supabase"
                      href={`/partners/experts`}
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
                            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      }
                    />

                    <PartnerLinkBox
                      href={`/partners/integrations#become-a-partner`}
                      title="Become a partner"
                      color="brand"
                      description="Fill out a quick 30 second form to apply to become a partner"
                      icon={
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="1"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
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
              <div className="grid space-y-10">
                {partners?.length ? (
                  <TileGrid partners={partners} />
                ) : (
                  <p className="h2">No Partners Found</p>
                )}
              </div>
            </div>
          </div>
        </SectionContainer>
        <BecomeAPartner />
      </DefaultLayout>
    </>
  )
}

export default IntegrationPartnersPage
