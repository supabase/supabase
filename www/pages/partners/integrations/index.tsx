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
        <SectionContainer className="space-y-12">
          {/* Horizontal link menu */}
          <div className="flex flex-col items-start justify-between w-full space-y-3 md:space-y-0 md:flex-row md:items-center">
            <h3 className="h3" style={{ marginBottom: 0 }}>
              Partners
            </h3>

            <div className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-6">
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
            </div>
          </div>

          {/* Title */}
          <h1 className="text-center h1">Find an Integration</h1>

          {/* Search Bar */}
          <div className="w-full space-y-3 md:space-y-0 md:flex md:space-x-6">
            <Input
              icon={<IconSearch />}
              placeholder="Search all partners"
              type="text"
              className="md:w-1/2"
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
            <Select
              className="font-sans md:w-1/2"
              onChange={(e) => {
                router.push(`#${e.target.value}`)
              }}
            >
              <option value="" disabled selected>
                Category
              </option>
              {allCategories.map((category) => (
                <option key={category} value={category.toLowerCase()}>
                  {category}
                </option>
              ))}
              <option value="become-a-partner">Become a partner</option>
            </Select>
          </div>

          {/* Partner Tiles */}
          <div className="grid space-y-10">
            {partners.length ? (
              <TileGrid partnersByCategory={partnersByCategory} />
            ) : (
              <h2 className="h2">No Partners Found</h2>
            )}
          </div>

          {/* Become a partner form */}
          <BecomeAPartner supabase={supabase} />
        </SectionContainer>
      </DefaultLayout>
    </>
  )
}

export default IntegrationPartnersPage
