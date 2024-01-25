import { CommandGroup } from './Command.utils'
import SearchOnlyItem from './SearchOnlyItem'

import sharedItems from './utils/shared-nav-items.json'

export default function SearchableStudioItems() {
  return (
    <CommandGroup heading="Find">
      {sharedItems.tools
        .filter((item) => item.subItems) // filter items with subItems
        .flatMap((item) =>
          item.subItems?.map((subItem) => (
            <SearchOnlyItem key={subItem.url + subItem.label} url={subItem.url}>
              {subItem.label}
            </SearchOnlyItem>
          ))
        )}
    </CommandGroup>
  )
}
