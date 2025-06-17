import { Boxes } from 'lucide-react'
import Link from 'next/link'

import { ActionCard } from 'components/ui/ActionCard'
import { useProjectsQuery } from 'data/projects/projects-query'
import { Organization } from 'types'

export const OrganizationCard = ({ organization }: { organization: Organization }) => {
  const { data: allProjects = [] } = useProjectsQuery()
  const numProjects = allProjects.filter((x) => x.organization_slug === organization.slug).length

  return (
    <Link href={`/new/${organization.slug}`}>
      <ActionCard
        bgColor="bg border"
        className="[&>div]:items-center"
        icon={<Boxes size={18} strokeWidth={1} className="text-foreground" />}
        title={organization.name}
        description={`${organization.plan.name} Plan${numProjects > 0 ? `${'  '}•${'  '}${numProjects} project${numProjects > 1 ? 's' : ''}` : ''}`}
      />
    </Link>
  )
}
