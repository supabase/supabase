import type { Category, Partner } from '~/types/partners'
import type { Listing } from 'common/marketplace-client'
import Image from 'next/image'
import Link from 'next/link'

export default function TileGrid({
  partners,
  hideCategories = false,
}: {
  partners: Partner[]
  hideCategories?: boolean
}) {
  const partnersByCategory: { [slug: string]: { category: Category; partners: Partner[] } } = {}
  partners.forEach((p) =>
    // TODO: This will result in duplicate listings if a partner appears in multiple categories. Consider choosing just one.
    p.categories.forEach((category) => {
      if (!partnersByCategory[category.slug]) {
        partnersByCategory[category.slug] = { category, partners: [] }
      }
      partnersByCategory[category.slug].partners.push(p)
    })
  )

  const featuredPartners = partners
    .filter((p) => p.featured)
    .toSorted((a, b) => a.title.localeCompare(b.title))

  return (
    <>
      {featuredPartners.length > 0 ? (
        <div
          key="featured"
          id="featured"
          className={`space-y-8 ${hideCategories ? `pb-8 border-b mb-8` : ''}`}
        >
          <h2 className="h2">Featured</h2>
          <div className="grid grid-cols-1 gap-5 lg:max-w-none lg:grid-cols-2 xl:grid-cols-3">
            {featuredPartners?.map((p) => (
              <Link key={p.slug} href={`/partners/integrations/${p.slug}`}>
                <div
                  className="
                bg-surface-100
                hover:bg-surface-200
                group flex h-full w-full flex-col rounded-xl border px-6
                py-6 shadow-sm
                transition-all
                hover:shadow-lg"
                >
                  <div className="flex w-full space-x-6">
                    <div className="relative h-[40px] min-w-[40px] w-[40px] rounded-full overflow-hidden scale-100 transition-all group-hover:scale-110">
                      <Image
                        layout="fill"
                        objectFit="cover"
                        className="bg-surface-100"
                        src={p.logo}
                        alt={p.title}
                      />
                    </div>
                    <div>
                      <h3 className="text-foreground-light group-hover:text-foreground mb-2 text-xl transition-colors">
                        {p.title}
                      </h3>
                      <p
                        className="text-foreground-lighter text-sm line-clamp-4 min-h-[80px]"
                        title={p.description}
                      >
                        {p.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      {Object.keys(partnersByCategory)
        .toSorted()
        .map((slug) => {
          const partners = partnersByCategory[slug].partners.toSorted((a, b) =>
            a.title.localeCompare(b.title)
          )
          return (
            <div key={slug} id={slug} className="space-y-8">
              {!hideCategories && <h2 className="h2">{partnersByCategory[slug].category.name}</h2>}
              <div className="grid  grid-cols-1 gap-5 lg:max-w-none lg:grid-cols-2 xl:grid-cols-3">
                {partners.map((p) => (
                  <Link key={p.slug} href={`/partners/integrations/${p.slug}`}>
                    <div
                      className="
                bg-surface-100
                hover:bg-surface-200
                group flex h-full w-full flex-col rounded-xl border px-6
                py-6 shadow-sm
                transition-all
                hover:shadow-lg"
                    >
                      <div className="flex w-full space-x-6">
                        <div className="relative h-[40px] min-w-[40px] w-[40px] rounded-full overflow-hidden scale-100 transition-all group-hover:scale-110">
                          <Image
                            layout="fill"
                            objectFit="cover"
                            className="bg-surface-100"
                            src={p.logo}
                            alt={p.title}
                          />
                        </div>
                        <div>
                          <h3 className="text-light group-hover:text-foreground mb-2 text-xl transition-colors">
                            {p.title}
                          </h3>
                          <p
                            className="text-foreground-lighter text-sm line-clamp-4 min-h-[80px]"
                            title={p.description}
                          >
                            {p.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
    </>
  )
}
