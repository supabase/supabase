import Link from 'next/link'
import { useMemo, useState } from 'react'

import { FormPanel } from 'components/ui/Forms/FormPanel'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { Organization } from 'types'
import { Badge, Button, Card, CardDescription, CardHeader, CardTitle, Input_Shadcn_ } from 'ui'

export interface ProjectClaimChooseOrgProps {
  onChoose: (org: Organization) => void
}

export function ProjectClaimChooseOrg({ onChoose }: ProjectClaimChooseOrgProps) {
  const { data: organizations = [], isLoading: isLoadingOrgs } = useOrganizationsQuery()

  const [search, setSearch] = useState('')

  const filteredOrgs = useMemo(() => {
    if (!search) return organizations.slice(0, 5)
    return organizations.filter((org) => org.name.toLowerCase().includes(search.toLowerCase()))
  }, [organizations, search])

  const searchParams = new URLSearchParams(location.search)
  let pathname = location.pathname
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH
  if (basePath) {
    pathname = pathname.replace(basePath, '')
  }

  searchParams.set('returnTo', pathname)

  return (
    <FormPanel
      header={
        <div className="flex items-center justify-between">
          <h2>Choose a Supabase Organisation</h2>
          <p className="text-foreground-light text-xs">Step 1 of 3</p>
        </div>
      }
    >
      <div className="w-full max-w-md mx-auto gap-y-4 py-6 flex flex-col">
        <p className="text-sm text-foreground-light">
          The chosen organization will be used to claim the project.
        </p>
        <Input_Shadcn_
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
        />
        <div>
          {filteredOrgs.length === 0 && (
            <div className="text-center text-foreground-light py-6">No organizations found.</div>
          )}
          {filteredOrgs.map((org) => (
            <Card
              key={org.id}
              className="hover:bg-surface-200 rounded-none first:rounded-t-lg last:rounded-b-lg -mb-px"
            >
              <CardHeader className="flex flex-row justify-between border-none">
                <CardTitle className="flex items-center gap-2">
                  <span className="truncate" title={org.name}>
                    {org.name}
                  </span>
                  <Badge>{org.plan?.name}</Badge>
                </CardTitle>
                <Button size="small" onClick={() => onChoose(org)}>
                  Choose
                </Button>
              </CardHeader>
            </Card>
          ))}
        </div>
        <Card className="flex items-center justify-between border-dashed pr-6">
          <CardHeader className="border-none">
            <CardTitle>Need a new organization?</CardTitle>
            <CardDescription>Create a new one</CardDescription>
          </CardHeader>
          <Button size="small" className="" asChild type="default">
            <Link href={`/new?${searchParams.toString()}`}>New Organization</Link>
          </Button>
        </Card>
      </div>
    </FormPanel>
  )
}
