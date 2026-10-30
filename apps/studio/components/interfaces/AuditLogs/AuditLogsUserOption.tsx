import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from 'ui'
import type { CustomOptionProps } from 'ui-patterns/FilterBar'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { useOrganizationMembersQuery } from '@/data/organizations/organization-members-query'

interface AuditLogsUserOptionProps extends CustomOptionProps {
  slug?: string
}

// Select-only member list for the FilterBar. The stored value is the member's gotrue_id, while
// the chip shows the username through the property's `formatValue`.
export const AuditLogsUserOption = ({ slug, onChange }: AuditLogsUserOptionProps) => {
  const { data, error, isLoading, isError, isSuccess } = useOrganizationMembersQuery({ slug })
  const members = (data ?? []).filter((member) => !member.invited_at && !!member.gotrue_id)

  return (
    <Command>
      <CommandInput
        showResetIcon
        placeholder="Find member..."
        className="text-base sm:text-sm"
        // FilterBar keeps focus on the chip's input, so move it here for cmdk's arrow/enter keys
        autoFocus
      />
      <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden">
        <CommandGroup>
          {isLoading && (
            <div className="px-2 py-1">
              <ShimmeringLoader className="py-2" />
            </div>
          )}
          {isError && (
            <p className="text-xs text-center text-foreground-lighter py-3">
              Failed to retrieve members: {error.message}
            </p>
          )}
          {isSuccess && members.length === 0 && (
            <p className="text-xs text-center text-foreground-lighter py-3">No members found</p>
          )}
          {isSuccess &&
            members.map((member) => (
              <CommandItem
                key={member.gotrue_id}
                value={`${member.username.replaceAll('"', '')}-${member.gotrue_id}`}
                className="cursor-pointer w-full"
                onSelect={() => onChange(member.gotrue_id)}
              >
                {member.username}
              </CommandItem>
            ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

// FilterBar invokes `component(props)` as a plain function, so this factory returns that function
// with `slug` bound, keeping the component itself defined at module level.
export const createAuditLogsUserOption = (slug?: string) => {
  const renderUserOption = (props: CustomOptionProps) => (
    <AuditLogsUserOption {...props} slug={slug} />
  )
  return renderUserOption
}
