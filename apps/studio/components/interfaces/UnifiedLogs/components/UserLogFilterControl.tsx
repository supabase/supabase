import { keepPreviousData } from '@tanstack/react-query'
import { useDebounce } from '@uidotdev/usehooks'
import { useParams } from 'common'
import { Loader2, Search, X } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useMemo, useState } from 'react'
import { AccordionContent, AccordionItem, AccordionTrigger, Button, Checkbox, cn, Label } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { InputWithAddons } from '@/components/ui/DataTable/primitives/InputWithAddons'
import { useUsersInfiniteQuery } from '@/data/auth/users-infinite-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

type UserOption = { id: string; email: string | null }

export const UserLogFilterControl = () => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const [user, setUser] = useQueryState('user', parseAsString)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 700)

  const { data, isFetching, isPending } = useUsersInfiniteQuery(
    {
      projectRef,
      connectionString: project?.connectionString,
      keywords: debouncedSearch.trim(),
      sort: 'id',
      order: 'asc',
    },
    { placeholderData: keepPreviousData }
  )

  const results: UserOption[] = useMemo(
    () =>
      (data?.pages[0]?.result ?? [])
        .filter((u): u is typeof u & { id: string } => !!u.id)
        .map((u) => ({ id: u.id, email: u.email ?? null })),
    [data?.pages]
  )

  // Only one user can be filtered on at a time — keep the current selection visible (and
  // checked) even if it falls outside the current search results, e.g. right after loading
  // from a deep link.
  const options: UserOption[] =
    user && !results.some((u) => u.id === user) ? [{ id: user, email: null }, ...results] : results

  const toggle = (id: string) => setUser(id === user ? null : id)

  return (
    <AccordionItem value="user" className="border-none">
      <div className="flex items-center gap-2 pr-2">
        <AccordionTrigger className="flex-1 px-2 py-0 hover:no-underline data-[state=closed]:text-muted-foreground data-open:text-foreground focus-within:data-closed:text-foreground hover:data-closed:text-foreground">
          <div className="flex items-center gap-2 truncate py-2">
            <p className="text-sm">User</p>
          </div>
        </AccordionTrigger>
        {user ? (
          <Button
            type="button"
            variant="outline"
            icon={<X />}
            className="h-5 rounded-full px-1.5 py-1 font-mono text-[10px] [&>span]:translate-y-[-0.6px] space-x-1"
            aria-label="Clear user filter"
            onClick={(e) => {
              e.stopPropagation()
              setUser(null)
            }}
          >
            1
          </Button>
        ) : null}
      </div>
      <AccordionContent>
        <div className="p-1 grid gap-2">
          <InputWithAddons
            placeholder="Search by email or id"
            leading={<Search size={14} className="text-foreground-lighter" />}
            containerClassName="h-8 rounded-sm"
            value={search}
            trailing={isFetching ? <Loader2 size={12} className="animate-spin" /> : undefined}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="max-h-[215px] overflow-y-auto rounded-sm border border-border empty:border-none">
            {isPending ? (
              <div className="p-2">
                <GenericSkeletonLoader />
              </div>
            ) : options.length === 0 ? (
              <div className="flex items-center justify-center px-2 py-3 text-center">
                <p className="text-xs text-foreground-lighter">No users found</p>
              </div>
            ) : (
              options.map((option, index) => {
                const checked = option.id === user

                return (
                  <div
                    key={option.id}
                    className={cn(
                      'group flex items-center gap-2 px-2 py-2 hover:bg-accent/50',
                      index !== options.length - 1 ? 'border-b' : undefined
                    )}
                  >
                    <Checkbox
                      id={`user-${option.id}`}
                      checked={checked}
                      onCheckedChange={() => toggle(option.id)}
                    />
                    <Label
                      htmlFor={`user-${option.id}`}
                      className="flex-1 min-w-0 text-[0.8rem] text-foreground/70 group-hover:text-accent-foreground"
                    >
                      <span className="truncate font-normal block">
                        {option.email ?? option.id}
                      </span>
                    </Label>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
