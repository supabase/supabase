import { useRouter } from 'next/router'
import { UseFormReturn } from 'react-hook-form'

import { LOCAL_STORAGE_KEYS, useFlag } from 'common'
import { InlineLink } from 'components/ui/InlineLink'
import { DesiredInstanceSize, instanceSizeSpecs } from 'data/projects/new-project.constants'
import { OrgProject } from 'data/projects/org-projects-infinite-query'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { DOCS_URL } from 'lib/constants'
import {
  Badge,
  Button,
  PopoverSeparator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { InfoTooltip } from 'ui-patterns/info-tooltip'
import { CreateProjectForm } from './ProjectCreation.schema'
import { instanceLabel, monthlyInstancePrice } from './ProjectCreation.utils'

interface ProjectCreationFooterProps {
  form: UseFormReturn<CreateProjectForm>
  canCreateProject: boolean
  instanceSize?: string
  organizationProjects: OrgProject[]
  isCreatingNewProject: boolean
  isSuccessNewProject: boolean
}

export const ProjectCreationFooter = ({
  form,
  canCreateProject,
  instanceSize,
  organizationProjects,
  isCreatingNewProject,
  isSuccessNewProject,
}: ProjectCreationFooterProps) => {
  const router = useRouter()
  const { data: currentOrg } = useSelectedOrganizationQuery()
  const isFreePlan = currentOrg?.plan?.id === 'free'

  const projectCreationDisabled = useFlag('disableProjectCreationAndUpdate')

  const [lastVisitedOrganization] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION,
    ''
  )

  const availableComputeCredits = organizationProjects.length === 0 ? 10 : 0
  const additionalMonthlySpend = isFreePlan
    ? 0
    : instanceSizeSpecs[instanceSize as DesiredInstanceSize]!.priceMonthly - availableComputeCredits

  // [kevin] This will eventually all be provided by a new API endpoint to preview and validate project creation, this is just for kaizen now
  const monthlyComputeCosts =
    // current project costs
    organizationProjects.reduce((prev, acc) => {
      const primaryDatabase = acc.databases.find((db) => db.identifier === acc.ref)
      const cost = !!primaryDatabase ? monthlyInstancePrice(primaryDatabase.infra_compute_size) : 0
      return prev + cost
    }, 0) +
    // selected compute size
    monthlyInstancePrice(instanceSize) -
    // compute credits
    10

  return (
    <div key="panel-footer" className="grid grid-cols-12 w-full gap-4 items-center">
      <div className="col-span-4">
        {!isFreePlan &&
          !projectCreationDisabled &&
          canCreateProject &&
          additionalMonthlySpend > 0 && (
            <div className="flex justify-between text-sm">
              <span>Additional costs</span>
              <div className="text-brand flex gap-1 items-center font-mono font-medium">
                <span>${additionalMonthlySpend}/m</span>
                <InfoTooltip side="top" className="max-w-[450px] p-0">
                  <div className="p-4 text-sm text-foreground-light space-y-1">
                    <p>
                      Each project includes a dedicated Postgres instance running on its own server.
                      You are charged for the{' '}
                      <InlineLink href={`${DOCS_URL}/guides/platform/billing-on-supabase`}>
                        Compute resource
                      </InlineLink>{' '}
                      of that server, independent of your database usage.
                    </p>
                    {monthlyComputeCosts > 0 && (
                      <p>Compute costs are applied on top of your subscription plan costs.</p>
                    )}
                  </div>

                  <Table className="mt-2">
                    <TableHeader className="[&_th]:h-7">
                      <TableRow className="py-2">
                        <TableHead className="w-[170px]">Project</TableHead>
                        <TableHead>Compute Size</TableHead>
                        <TableHead className="text-right">Monthly Costs</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="[&_td]:py-2">
                      {organizationProjects.map((project) => {
                        const primaryDb = project.databases.find(
                          (db) => db.identifier === project.ref
                        )
                        return (
                          <TableRow key={project.ref} className="text-foreground-light">
                            <TableCell className="w-[170px] truncate">{project.name}</TableCell>
                            <TableCell className="text-center">
                              {instanceLabel(primaryDb?.infra_compute_size)}
                            </TableCell>
                            <TableCell className="text-right">
                              ${monthlyInstancePrice(primaryDb?.infra_compute_size)}
                            </TableCell>
                          </TableRow>
                        )
                      })}

                      <TableRow>
                        <TableCell className="w-[170px] flex gap-2">
                          <span className="truncate">
                            {form.getValues('projectName') || 'New project'}
                          </span>
                          <Badge variant="success">New</Badge>
                        </TableCell>
                        <TableCell className="text-center">{instanceLabel(instanceSize)}</TableCell>
                        <TableCell className="text-right">
                          ${monthlyInstancePrice(instanceSize)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <PopoverSeparator />
                  <Table>
                    <TableHeader className="[&_th]:h-7">
                      <TableRow>
                        <TableHead colSpan={2}>Compute Credits</TableHead>
                        <TableHead colSpan={1} className="text-right">
                          -$10
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="[&_td]:py-2">
                      <TableRow className="text-foreground">
                        <TableCell colSpan={2}>
                          Total Monthly Compute Costs
                          {/**
                           * API currently doesnt output replica information on the projects list endpoint. Until then, we cannot correctly calculate the costs including RRs.
                           * Will be adjusted in the future [kevin]
                           */}
                          {organizationProjects.length > 0 && (
                            <p className="text-xs text-foreground-lighter">
                              Excluding Read replicas
                            </p>
                          )}
                        </TableCell>
                        <TableCell colSpan={1} className="text-right">
                          ${monthlyComputeCosts}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </InfoTooltip>
              </div>
            </div>
          )}
      </div>

      <div className="flex items-end col-span-8 space-x-2 ml-auto">
        <Button
          type="default"
          disabled={isCreatingNewProject || isSuccessNewProject}
          onClick={() => {
            if (!!lastVisitedOrganization) router.push(`/org/${lastVisitedOrganization}`)
            else router.push('/organizations')
          }}
        >
          Cancel
        </Button>
        <Button
          htmlType="submit"
          loading={isCreatingNewProject || isSuccessNewProject}
          disabled={!canCreateProject}
        >
          Create new project
        </Button>
      </div>
    </div>
  )
}
