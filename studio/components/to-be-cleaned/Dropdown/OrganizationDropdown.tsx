import { useRouter } from 'next/router'

import { EMPTY_ARR } from 'lib/void'
import {
  Button,
  DropdownMenuContent_Shadcn_,
  DropdownMenuItem_Shadcn_,
  DropdownMenuLabel_Shadcn_,
  DropdownMenuSeparator_Shadcn_,
  DropdownMenuTrigger_Shadcn_,
  DropdownMenu_Shadcn_,
  IconPlus,
} from 'ui'

const OrganizationDropdown = ({
  organizations = EMPTY_ARR,
}: {
  organizations: { name: string; slug: string }[]
}) => {
  const router = useRouter()

  return (
    <DropdownMenu_Shadcn_>
      <DropdownMenuTrigger_Shadcn_>
        <Button asChild>
          <span>New project</span>
        </Button>
      </DropdownMenuTrigger_Shadcn_>
      <DropdownMenuContent_Shadcn_ side="bottom" align="center">
        <>
          <DropdownMenuLabel_Shadcn_>Choose organization</DropdownMenuLabel_Shadcn_>
          {organizations
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((x) => (
              <DropdownMenuItem_Shadcn_ key={x.slug} onClick={() => router.push(`/new/${x.slug}`)}>
                {x.name}
              </DropdownMenuItem_Shadcn_>
            ))}
          <DropdownMenuSeparator_Shadcn_ />
          <DropdownMenuItem_Shadcn_ className="space-x-2" onClick={() => router.push(`/new`)}>
            <IconPlus size="tiny" />
            <p className="text">New organization</p>
          </DropdownMenuItem_Shadcn_>
        </>
      </DropdownMenuContent_Shadcn_>
    </DropdownMenu_Shadcn_>
  )
}
export default OrganizationDropdown
