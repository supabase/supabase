import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  IconArrowDown,
  IconArrowUp,
  IconRefreshCw,
  IconSearch,
  Input,
} from 'ui'

export const QueryPerformanceFilterBar = ({
  isLoading,
  onRefreshClick,
}: {
  isLoading: boolean
  onRefreshClick: () => void
}) => {
  const router = useRouter()
  const defaultSearchQueryValue = router.query.search ? String(router.query.search) : ''
  const defaultSortByValue = router.query.sort ? String(router.query.sort) : 'lat_desc'
  const [searchInputVal, setSearchInputVal] = useState(defaultSearchQueryValue)
  const [sortByValue, setSortByValue] = useState(defaultSortByValue)

  function getSortButtonLabel() {
    const sort = router.query.sort as 'lat_desc' | 'lat_asc'

    if (sort === 'lat_desc') {
      return 'Sorted by latency - high to low'
    } else {
      return 'Sorted by latency - low to high'
    }
  }

  function onSortChange(sort: string) {
    setSortByValue(sort)
    router.push({
      ...router,
      query: {
        ...router.query,
        sort,
      },
    })
  }

  const ButtonIcon = sortByValue === 'lat_desc' ? IconArrowDown : IconArrowUp

  return (
    <>
      <div className="flex justify-between items-center">
        <form
          className="py-3 flex gap-4"
          id="log-panel-search"
          onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.target as HTMLFormElement)
            const searchQuery = formData.get('search')

            if (!searchQuery || typeof searchQuery !== 'string') {
              // if user has deleted the search query, remove it from the url
              const { search, ...rest } = router.query
              router.push({
                ...router,
                query: {
                  ...rest,
                },
              })
              return
            }

            router.push({
              ...router,
              query: {
                ...router.query,
                search: searchQuery,
              },
            })
          }}
        >
          <Input
            className="w-60 group"
            size="tiny"
            placeholder="Search roles or queries"
            name="search"
            value={searchInputVal}
            onChange={(e) => setSearchInputVal(e.target.value)}
            autoComplete="off"
            icon={
              <div className="text-foreground-lighter">
                <IconSearch size={14} />
              </div>
            }
            actions={
              searchInputVal !== '' && (
                <button className="mx-2 text-foreground-light hover:text-foreground">{'↲'}</button>
              )
            }
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button icon={<ButtonIcon />}>{getSortButtonLabel()}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuRadioGroup value={sortByValue} onValueChange={onSortChange}>
                <DropdownMenuRadioItem
                  defaultChecked={router.query.sort === 'lat_desc'}
                  value={'lat_desc'}
                >
                  Sort by latency - high to low
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value={'lat_asc'}
                  defaultChecked={router.query.sort === 'lat_asc'}
                >
                  Sort by latency - low to high
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </form>
        <div>
          <Button
            type="default"
            size="tiny"
            onClick={onRefreshClick}
            disabled={isLoading ? true : false}
            icon={
              <IconRefreshCw
                size="tiny"
                className={`text-foreground-light ${isLoading ? 'animate-spin' : ''}`}
              />
            }
          >
            {isLoading ? 'Refreshing' : 'Refresh'}
          </Button>
        </div>
      </div>
    </>
  )
}
