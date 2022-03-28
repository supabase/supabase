import Link from 'next/link'
import { Partner } from '~/types/partners'

export default function TileGrid({
  partnersByCategory,
  hideCategories = false,
}: {
  partnersByCategory: { [category: string]: Partner[] }
  hideCategories: boolean
}) {
  return (
    <>
      {Object.keys(partnersByCategory).map((category) => (
        <div key={category} id={category.toLowerCase()} className="space-y-8">
          {!hideCategories && <h2 className="h2">{category}</h2>}
          <div className="grid max-w-lg gap-5 lg:grid-cols-1 xl:grid-cols-3 lg:max-w-none">
            {partnersByCategory[category].map((p) => (
              <Link key={p.slug} href={`/partners/${p.slug}`}>
                <a
                  className="
                "
                >
                  <div
                    className="transition-all

                bg-scale-100 dark:bg-scale-300
                hover:bg-scale-200 hover:dark:bg-scale-400
                group flex flex-col w-full h-full px-6 py-6 transition-all 
                border rounded 
                shadow 

               
                
                hover:shadow-lg"
                  >
                    <div className="flex w-full space-x-6">
                      <img
                        className="
                      transition-all scale-100 group-hover:scale-110
                      flex-shrink-0 w-12 h-12 bg-gray-300 rounded-full
                      "
                        src={p.logo}
                        alt={p.title}
                      />
                      <div>
                        {/* <span className="text-xs text-scale-900">{p.category}</span> */}
                        <h3 className="transition-colors text-xl text-scale-1100 group-hover:text-scale-1200 mb-2">
                          {p.title}
                        </h3>
                        <p className="text-sm text-scale-900">{p.description}</p>
                      </div>
                    </div>
                  </div>
                </a>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}
