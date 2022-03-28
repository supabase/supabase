import Image from 'next/image'
import Link from 'next/link'
import { Partner } from '~/types/partners'

export default function TileGrid({
  partnersByCategory,
}: {
  partnersByCategory: { [category: string]: Partner[] }
}) {
  return (
    <>
      {Object.keys(partnersByCategory).map((category) => (
        <div key={category} id={category.toLowerCase()} className="space-y-8">
          <h2 className="h2">{category}</h2>
          <div className="grid max-w-lg gap-5 mx-auto lg:grid-cols-3 lg:max-w-none">
            {partnersByCategory[category].map((p) => (
              <Link key={p.slug} href={`/partners/${p.slug}`}>
                <a className="flex flex-col w-full h-full p-4 transition-all border rounded-lg shadow border-scale-300 bg-scale-400 hover:-translate-y-1 hover:shadow-lg">
                  <div className="flex justify-between w-full space-x-6">
                    <div>
                      <span className="text-sm text-scale-1100">{p.category}</span>
                      <h3 className="h3">{p.title}</h3>
                    </div>
                    <Image
                      layout="fixed"
                      width={40}
                      height={40}
                      className="flex-shrink-0 w-10 h-10 bg-gray-300 rounded-full"
                      src={p.logo}
                      alt={p.title}
                    />
                  </div>
                  <span className="text-scale-1200">{p.description}</span>
                </a>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}
