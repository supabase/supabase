interface Partner {
  title: string
  size: string
  source: string
}

export default function TileGrid({
  category,
  partners,
}: {
  category: string
  partners: Partner[]
}) {
  console.log(partners, category)
  return (
    <ul
      role="list"
      className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8"
    >
      {partners.map((partner) => (
        <li key={partner.source} className="relative">
          <div className="group block w-full aspect-w-10 aspect-h-7 rounded-lg bg-gray-100 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-100 focus-within:ring-indigo-500 overflow-hidden">
            <img
              src={partner.source}
              alt=""
              className="object-cover pointer-events-none group-hover:opacity-75"
            />
            <button type="button" className="absolute inset-0 focus:outline-none">
              <span className="sr-only">View details for {partner.title}</span>
            </button>
          </div>
          <p className="mt-2 block text-sm font-medium text-gray-900 truncate pointer-events-none">
            {partner.title}
          </p>
          <p className="block text-sm font-medium text-gray-500 pointer-events-none">
            {partner.size}
          </p>
        </li>
      ))}
    </ul>
  )
}
