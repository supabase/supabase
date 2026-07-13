import { useParams } from 'common'
import { User, X } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useState, type KeyboardEvent } from 'react'
import { AccordionContent, AccordionItem, AccordionTrigger, Button } from 'ui'

import { searchAuthUserByEmail } from '@/components/interfaces/UserJourneys/UserJourneys.queries'
import { InputWithAddons } from '@/components/ui/DataTable/primitives/InputWithAddons'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { UUID_REGEX } from '@/lib/constants'

export const UserLogFilterControl = () => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const [user, setUser] = useQueryState('user', parseAsString)
  const [value, setValue] = useState(user ?? '')
  const [isResolving, setIsResolving] = useState(false)

  // Keep the input in sync when the filter is set/cleared elsewhere (deep link, reset).
  useEffect(() => {
    setValue(user ?? '')
  }, [user])

  const apply = async () => {
    const raw = value.trim()
    if (!raw) {
      setUser(null)
      return
    }
    if (UUID_REGEX.test(raw) || !raw.includes('@')) {
      setUser(raw)
      return
    }
    // Email → resolve to id where an account exists; fall back to the raw email otherwise.
    setIsResolving(true)
    try {
      const resolved = await searchAuthUserByEmail(
        projectRef!,
        project?.connectionString ?? null,
        raw
      ).catch(() => undefined)
      setUser(resolved?.id ?? raw)
    } finally {
      setIsResolving(false)
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      apply()
    }
  }

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
        <div className="p-1">
          <InputWithAddons
            placeholder="Email or user id"
            leading={<User className="h-4 w-4" />}
            containerClassName="h-9 rounded-sm"
            name="user"
            id="user"
            value={value}
            disabled={isResolving}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={apply}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
