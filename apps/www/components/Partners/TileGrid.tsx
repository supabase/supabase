import Image from 'next/image'
import Link from 'next/link'
import { Partner } from '~/types/partners'

export default function TileGrid({
  partnersByCategory,
  hideCategories = false,
}: {
  partnersByCategory: { [category: string]: Partner[] }
  hideCategories?: boolean
}) {
  return (
    <>
      {Object.keys(partnersByCategory).map((category) => (
        <div key={category} id={category.toLowerCase()} className="space-y-8">
          {!hideCategories && <h2 className="h2">{category}</h2>}
          <div className="grid  grid-cols-1 gap-5 lg:max-w-none lg:grid-cols-2 xl:grid-cols-3">
            {partnersByCategory[category].map((p) => (
              <Link key={p.slug} href={`/partners/${p.slug}`}>
                <a
                  className="
                "
                >
                  <div
                    className="

                bg-scale-100 dark:bg-scale-300
                hover:bg-scale-200 hover:dark:bg-scale-400
                group flex h-full w-full flex-col rounded border px-6 
                py-6 shadow 
                transition-all 

               
                
                hover:shadow-lg"
                  >
                    <div className="flex w-full space-x-6">
                      <div className="h-10 w-10 scale-100 transition-all group-hover:scale-110">
                        <Image
                          layout="fixed"
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full bg-gray-300"
                          src={p.logo}
                          alt={p.title}
                        />
                      </div>
                      <div>
                        <h3 className="text-scale-1100 group-hover:text-scale-1200 mb-2 text-xl transition-colors">
                          {p.title}
                        </h3>
                        <p className="text-scale-900 text-sm">{p.description}</p>
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
