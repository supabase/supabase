import { CommandGroup } from './Command.utils'
import SearchOnlyItem from './SearchOnlyItem'
import { useRouter } from 'next/router'

import sharedItems from './utils/shared-nav-items.json'

export default function SearchableStudioItems() {
  const router = useRouter()

  return (
    <CommandGroup heading="Find">
      {sharedItems.tools
        .filter((item) => item.subItems) // filter items with subItems
        .flatMap((item) =>
          item.subItems?.map((subItem) => (
            <SearchOnlyItem
              key={subItem.url}
              isSubItem={true}
              onSelect={() => router.push(subItem.url)}
            >
              {subItem.label}
            </SearchOnlyItem>
          ))
        )}
    </CommandGroup>
  )
}
