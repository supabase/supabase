import Image from 'next/image'
import Link from 'next/link'
import type { Partner } from '~/types/partners'

export default function TileGrid({
  partners,
  hideCategories = false,
}: {
  partners: Partner[]
  hideCategories?: boolean
}) {
  const partnersByCategory: { [category: string]: Partner[] } = {}
  partners.forEach(
    (p) => (partnersByCategory[p.category] = [...(partnersByCategory[p.category] ?? []), p])
  )

  const featuredPartners = partners.filter((p) => p.featured)

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
              <Link key={p.slug} href={`/partners/${p.slug}`}>
                <div
                  className="
                bg-surface-100
                hover:bg-surface-200
                group flex h-full w-full flex-col rounded-xl border px-6
                py-6 shadow
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
      {Object.keys(partnersByCategory).map((category) => (
        <div key={category} id={category.toLowerCase()} className="space-y-8">
          {!hideCategories && <h2 className="h2">{category}</h2>}
          <div className="grid  grid-cols-1 gap-5 lg:max-w-none lg:grid-cols-2 xl:grid-cols-3">
            {partnersByCategory[category].map((p) => (
              <Link key={p.slug} href={`/partners/${p.slug}`}>
                <div
                  className="
                bg-surface-100
                hover:bg-surface-200
                group flex h-full w-full flex-col rounded-xl border px-6
                py-6 shadow
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
      ))}
    </>
  )
}
