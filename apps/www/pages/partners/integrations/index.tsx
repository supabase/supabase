import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import supabase from '~/lib/supabaseMisc'
import type { Partner } from '~/types/partners'
import { ArrowRight, ArrowUpRight, Loader, Search } from 'lucide-react'
import { NextSeo } from 'next-seo'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Button, cn, InputGroup, InputGroupAddon, InputGroupInput } from 'ui'
import { useDebounce } from 'use-debounce'

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

  const meta_title = 'Partners building with Supabase'
  const meta_description = `Browse companies that build on Supabase, integrate with Supabase, or both.`

  const [search, setSearch] = useState('')
  const [debouncedSearchTerm] = useDebounce(search, 300)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

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
          <div className="flex flex-col gap-3">
            <span className="text-brand font-mono uppercase tracking-widest text-sm">
              Partner Catalog
            </span>
            <h1 className="h1 !mb-0">{meta_title}</h1>
            <p className="text-foreground-lighter text-xl max-w-2xl">{meta_description}</p>
          </div>
          {(() => {
            const featuredPartners = partners.filter((p) => p.featured).slice(0, 6)
            const featuredSlugs = new Set(featuredPartners.map((p) => p.slug))
            const hasSearchQuery = search.trim() !== ''
            const isFiltered = hasSearchQuery || selectedCategory !== null
            const showFeatured = !isFiltered && featuredPartners.length > 0
            const listPartners = hasSearchQuery
              ? partners
              : selectedCategory
                ? partners.filter((p) => p.category === selectedCategory)
                : showFeatured
                  ? partners.filter((p) => !featuredSlugs.has(p.slug))
                  : partners

            return (
              <div className="space-y-10">
                {/* Search + category pills (sticky) */}
                <div className="sticky top-16 z-20 -mx-6 px-6 py-4 lg:-mx-16 lg:px-16 xl:-mx-20 xl:px-20 bg-alternative/90 backdrop-blur-md flex flex-col gap-4">
                  <div className="max-w-md">
                    <InputGroup className="w-full">
                      <InputGroupInput
                        size="small"
                        autoComplete="off"
                        type="search"
                        placeholder="Search partners..."
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
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(null)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-sm transition-colors',
                        selectedCategory === null
                          ? 'bg-foreground text-background border-foreground'
                          : 'bg-background hover:bg-surface-100 text-foreground-light'
                      )}
                    >
                      All
                    </button>
                    {allCategories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setSelectedCategory(category)}
                        className={cn(
                          'rounded-full border px-3 py-1 text-sm transition-colors',
                          selectedCategory === category
                            ? 'bg-foreground text-background border-foreground'
                            : 'bg-background hover:bg-surface-100 text-foreground-light'
                        )}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Featured grid — shown when not filtering */}
                {showFeatured && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {featuredPartners.map((p) => (
                      <Link
                        key={p.slug}
                        href={`/partners/integrations/${p.slug}`}
                        className="group flex h-full flex-col gap-3 rounded-xl border bg-surface-100 p-5 transition-colors hover:bg-surface-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative size-10 shrink-0 rounded-full overflow-hidden bg-muted">
                            <Image
                              src={p.logo}
                              alt={p.title}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                          <div className="flex flex-wrap items-center gap-2 min-w-0">
                            <h3 className="text-foreground text-base font-medium tracking-tight">
                              {p.title}
                            </h3>
                            <span className="text-foreground-lighter font-mono text-xs uppercase tracking-wide rounded-full border px-2 py-0.5">
                              {p.category}
                            </span>
                          </div>
                        </div>
                        <p className="text-foreground-lighter text-sm line-clamp-3 text-pretty">
                          {p.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Compact list */}
                {listPartners.length ? (
                  <div className="border bg-background rounded-xl overflow-hidden divide-y">
                    {listPartners.map((p) => (
                      <Link
                        key={p.slug}
                        href={`/partners/integrations/${p.slug}`}
                        className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-100"
                      >
                        <div className="relative size-10 shrink-0 rounded-full overflow-hidden bg-muted">
                          <Image
                            src={p.logo}
                            alt={p.title}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-foreground text-sm font-medium tracking-tight">
                              {p.title}
                            </span>
                            <span className="text-foreground-lighter font-mono text-xs uppercase tracking-wide rounded-full border px-2 py-0.5">
                              {p.category}
                            </span>
                          </div>
                          <p className="text-foreground-lighter text-sm truncate">
                            {p.description}
                          </p>
                        </div>
                        <ArrowUpRight
                          size={16}
                          className="shrink-0 text-foreground-lighter transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-foreground-lighter">No partners found.</p>
                )}
              </div>
            )
          })()}
        </SectionContainer>
        <div className="border-t bg-background">
          <div
            id="become-a-partner"
            className="mx-auto max-w-2xl flex flex-col items-center gap-6 py-32 px-6 text-center"
          >
            <h2 className="h2 tracking-[-1px]">
              Interested in adding your product to the catalog?
            </h2>
            <Button asChild size="medium" iconRight={<ArrowRight />}>
              <Link href="/partners">Become a partner</Link>
            </Button>
          </div>
        </div>
      </DefaultLayout>
    </>
  )
}

export default IntegrationPartnersPage
