import { PropsWithChildren } from 'react'
import { ScaffoldContainer } from './Scaffold'
import { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import Link from 'next/link'

interface ProjectSubNavigationLayout {
  submenu: ProductMenuGroup[]
}

export default function ProjectSubNavigationLayout({
  children,
  submenu,
}: PropsWithChildren<ProjectSubNavigationLayout>) {
  return (
    <ScaffoldContainer className="flex flex-row gap-20 py-20">
      <nav className="w-32">
        <ol className="flex flex-col gap-1">
          {submenu[0].items.map((item) => {
            return (
              <>
                <Link href={item.url} key={item.key}>
                  {item.name}
                </Link>
              </>
            )
          })}
        </ol>
      </nav>
      {children}
    </ScaffoldContainer>
  )
}
