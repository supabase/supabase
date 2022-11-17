import Link from 'next/link'

const LibraryNavigationMenu = ({ items }) => {
  return (
    <ul>
      {items.map((item) =>
        item.title ? (
          <li>
            <Link href={`#${item.id}`} key={item.id}>
              <a
                className={[
                  'block text-sm hover:text-scale-1200 text-scale-1100 cursor-pointer',
                  2 < 1 ? 'text-brand-900' : 'text-scale-1100',
                ].join(' ')}
              >
                {item.title}
              </a>
            </Link>
          </li>
        ) : null
      )}
    </ul>
  )
}

export default LibraryNavigationMenu
