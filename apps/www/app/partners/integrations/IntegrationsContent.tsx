'use client'

import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import BecomeAPartner from '~/components/Partners/BecomeAPartner'
import PartnerLinkBox from '~/components/Partners/PartnerLinkBox'
import TileGrid from '~/components/Partners/TileGrid'
import supabase from '~/lib/supabaseMisc'
import type { Partner } from '~/types/partners'
import { Loader, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { InputGroup, InputGroupAddon, InputGroupInput } from 'ui'
import { useDebounce } from 'use-debounce'

interface Props {
  initialPartners: Partner[]
  metaTitle: string
  metaDescription: string
}

export default function IntegrationsContent({
  initialPartners,
  metaTitle,
  metaDescription,
}: Props) {
  const [partners, setPartners] = useState(initialPartners)

  const allCategories = Array.from(new Set(initialPartners?.map((p) => p.category)))

  const router = useRouter()

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm])

  return (
    <DefaultLayout className="bg-alternative">
      <SectionContainer className="space-y-16">
        <div>
          <h1 className="h1">{metaTitle}</h1>
          <p className="text-foreground-lighter text-xl">{metaDescription}</p>
        </div>
        {/* Title */}
        <div className="grid space-y-12 md:gap-8 lg:grid-cols-12 lg:gap-16 lg:space-y-0 xl:gap-16">
          <div className="lg:col-span-4 xl:col-span-3">
            {/* Horizontal link menu */}
            <div className="space-y-6">
              {/* Search Bar */}
              <InputGroup className="w-full">
                <InputGroupInput
                  size="small"
                  autoComplete="off"
                  type="search"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <InputGroupAddon>
                  <Search />
                </InputGroupAddon>
                {isSearching && (
                  <InputGroupAddon align="inline-end">
                    <span className="mr-1 animate-spin text-white">
                      <Loader />
                    </span>
                  </InputGroupAddon>
                )}
              </InputGroup>
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
  )
}
