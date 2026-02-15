import React, { useMemo, useState } from 'react'
import { Card } from 'ui'
import {
  InnerSideBarEmptyPanel,
  InnerSideBarFilters,
  InnerSideBarFilterSearchInput,
  InnerSideBarFilterSortDropdown,
  InnerSideBarFilterSortDropdownItem,
  InnerSideMenuCollapsible,
  InnerSideMenuCollapsibleContent,
  InnerSideMenuCollapsibleTrigger,
  InnerSideMenuItem,
} from 'ui-patterns/InnerSideMenu'

export default function InnerSideMenuWithSearch() {
  const [sort, setSort] = useState('alphabetical')
  const [searchTerm, setSearchTerm] = useState('')

  const foodCategories = {
    Fruits: ['Apple', 'Banana', 'Orange', 'Strawberry'],
    Vegetables: ['Carrot', 'Broccoli', 'Spinach', 'Tomato'],
    Grains: ['Rice', 'Wheat', 'Oats', 'Quinoa'],
    Proteins: ['Chicken', 'Beef', 'Fish', 'Tofu'],
  }

  const filteredAndSortedCategories = useMemo(() => {
    return Object.entries(foodCategories).reduce(
      (acc, [category, items]) => {
        let filteredItems = items.filter((item) =>
          item.toLowerCase().includes(searchTerm.toLowerCase())
        )

        // Sort the filtered items
        filteredItems.sort((a, b) => {
          if (sort === 'alphabetical') {
            return a.localeCompare(b)
          } else {
            return b.localeCompare(a)
          }
        })

        acc[category] = filteredItems
        return acc
      },
      {} as Record<string, string[]>
    )
  }, [foodCategories, searchTerm, sort])

  return (
    <Card className="w-64 py-4 flex flex-col gap-4 bg-dash-sidebar">
      <InnerSideBarFilters>
        <InnerSideBarFilterSearchInput
          name="search-input"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-labelledby="Search items"
        >
          <InnerSideBarFilterSortDropdown value={sort} onValueChange={(value) => setSort(value)}>
            <InnerSideBarFilterSortDropdownItem value="alphabetical">
              Sort Alphabetically
            </InnerSideBarFilterSortDropdownItem>
            <InnerSideBarFilterSortDropdownItem value="reverse">
              Sort Reverse Alphabetically
            </InnerSideBarFilterSortDropdownItem>
          </InnerSideBarFilterSortDropdown>
        </InnerSideBarFilterSearchInput>
      </InnerSideBarFilters>

      {Object.entries(filteredAndSortedCategories).map(([category, items]) => (
        <InnerSideMenuCollapsible key={category} defaultOpen>
          <InnerSideMenuCollapsibleTrigger title={category} />
          <InnerSideMenuCollapsibleContent className="pt-2">
            {items.length > 0 ? (
              items.map((item) => (
                <InnerSideMenuItem key={item} href="#">
                  {item}
                </InnerSideMenuItem>
              ))
            ) : (
              <InnerSideBarEmptyPanel
                className="mx-2"
                title={`No ${category.toLowerCase()} found`}
                description={`Your search did not return any results in ${category}`}
              />
            )}
          </InnerSideMenuCollapsibleContent>
        </InnerSideMenuCollapsible>
      ))}
    </Card>
  )
}
