import { createClient } from '@supabase/supabase-js'
import { IconArrowRight, IconLoader, IconSearch, Input, Select } from '@supabase/ui'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useDebounce } from 'use-debounce'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import BecomeAPartner from '~/components/Partners/BecomeAPartners'
import PartnerLinkBox from '~/components/Partners/PartnerLinkBox'
import { Partner } from '~/types/partners'
import TileGrid from '../../../components/Partners/TileGrid'

const supabase = createClient(
  'https://obuldanrptloktxcffvn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNzY1NjAxNSwiZXhwIjoxOTUzMjMyMDE1fQ.0sfp_Njf7l4g-nOCF5a1TQE11rPqtz8Y10uctIetkBA'
)

export async function getStaticProps() {
  const { data: partners } = await supabase
    .from<Partner>('partners')
    .select('*')
    .eq('approved', true)
    .eq('type', 'technology')
    .order('category')
    .order('title')

  return {
    props: {
      partners,
    },
    // TODO: consider using Next.js' On-demand Revalidation with Supabase function hooks instead
    revalidate: 18000, // In seconds - refresh every 5 hours
  }
}

interface Props {
  partners: Partner[]
}

function IntegrationPartnersPage(props: Props) {
  const { partners: initialPartners } = props
  const [partners, setPartners] = useState(initialPartners)

  const allCategories = Array.from(new Set(initialPartners.map((p) => p.category)))

  const partnersByCategory: { [category: string]: Partner[] } = {}
  partners.forEach(
    (p) => (partnersByCategory[p.category] = [...(partnersByCategory[p.category] ?? []), p])
  )
  const router = useRouter()

  const meta_title = 'Works With Supabase'
  const meta_description = `Find Integration Partners and Expert Services that work with Supabase.`

  const [search, setSearch] = useState('')
  const [debouncedSearchTerm] = useDebounce(search, 300)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const searchPartners = async () => {
      setIsSearching(true)

      let query = supabase
        .from<Partner>('partners')
        .select('*')
        .eq('approved', true)
        .order('category')
        .order('title')

      if (search.trim()) {
        query = query
          // @ts-ignore
          .textSearch('tsv', `${search.trim()}`, {
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
          url: `https://supabase.com/partners`,
          images: [
            {
              url: `https://supabase.com${router.basePath}/images/product/database/database-og.jpg`, // TODO
            },
          ],
        }}
      />
      <DefaultLayout>
        <SectionContainer className="space-y-16">
          <div>
            <h1 className="h1">Find an Integration</h1>
            <h2 className="text-xl text-scale-900">
              Extend and automate your workflow by using integrations for your favorite tools.
            </h2>
          </div>
          {/* Title */}
          <div className="grid grid-cols-12 lg:gap-16 xl:gap-32">
            <div className="col-span-3">
              {/* Horizontal link menu */}
              <div className="space-y-6">
                {/* Search Bar */}

                <Input
                  size="small"
                  icon={<IconSearch />}
                  placeholder="Search..."
                  type="text"
                  // className="md:w-1/2"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  actions={
                    isSearching && (
                      <span className="mr-1 text-white animate-spin">
                        <IconLoader />
                      </span>
                    )
                  }
                />
                <div>
                  <div className="text-sm text-scale-900 mb-2">Categories</div>
                  <div className="space-y-1">
                    {allCategories.map((category) => (
                      <button
                        key={category}
                        onClick={() => router.push(`#${category.toLowerCase()}`)}
                        className="block text-base text-scale-1100"
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="text-sm text-scale-900 mb-2">Explore more</div>
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
                        stroke-width="1"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    }
                  />
                  <PartnerLinkBox
                    title="Become a partner"
                    color="brand"
                    description="Fill out a quick 30 second form to apply to become a partner"
                    href={`/partners/experts`}
                    icon={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="1"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    }
                  />
                </div>
                {/* <div className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-6">
                  <Link href={`/partners/integrations`}>
                    <a className="text-scale-1200">INTEGRATIONS</a>
                  </Link>
                  <Link href={`/partners/experts`}>
                    <a className="transition-colors text-brand-900 hover:text-brand-800">EXPERTS</a>
                  </Link>
                  <Link href={`/partners/integrations#become-a-partner`}>
                    <a className="flex items-center space-x-1 transition-colors text-brand-900 hover:text-brand-800">
                      BECOME A PARTNER <IconArrowRight />
                    </a>
                  </Link>
                </div> */}
              </div>
            </div>
            <div className="col-span-9">
              {/* Partner Tiles */}
              <div className="grid space-y-10">
                {partners.length ? (
                  <TileGrid partnersByCategory={partnersByCategory} />
                ) : (
                  <h2 className="h2">No Partners Found</h2>
                )}
              </div>
            </div>
          </div>
          {/* Become a partner form */}
          <BecomeAPartner supabase={supabase} />
        </SectionContainer>
      </DefaultLayout>
    </>
  )
}

export default IntegrationPartnersPage
