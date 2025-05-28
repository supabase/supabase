import { useState } from 'react'
import { useRouter } from 'next/router'

import { useParams } from 'common'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer, ScaffoldHeader, ScaffoldTitle } from 'components/layouts/Scaffold'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useBranchMergeMutation } from 'data/branches/branch-merge-mutation'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
} from 'ui'
import { toast } from 'sonner'
import type { NextPageWithLayout } from 'types'

const MergePage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()
  const project = useSelectedProject()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isBranch = project?.parent_project_ref !== undefined
  const parentProjectRef = project?.parent_project_ref

  // Get branch information
  const { data: branches } = useBranchesQuery({ projectRef: parentProjectRef })
  const currentBranch = branches?.find((branch) => branch.project_ref === ref)
  const mainBranch = branches?.find((branch) => branch.is_default)

  const { mutate: mergeBranch, isLoading: isMerging } = useBranchMergeMutation({
    onSuccess: () => {
      toast.success('Branch merged successfully!')
      if (parentProjectRef) {
        router.push(`/project/${parentProjectRef}`)
      }
    },
    onError: (error) => {
      toast.error(`Failed to merge branch: ${error.message}`)
    },
  })

  const handleMerge = () => {
    if (!currentBranch?.id || !parentProjectRef) return
    setIsSubmitting(true)
    mergeBranch({
      id: currentBranch.id,
      projectRef: parentProjectRef,
      migration_version: undefined,
    })
  }

  // Mock data for demonstration
  const schemaDiff = [
    {
      type: 'added',
      name: 'employees',
      description: 'CREATE TABLE employees with job_title column',
    },
  ]

  const configDiff = [
    {
      type: 'unchanged',
      name: 'Database settings',
      description: 'No configuration changes',
    },
  ]

  const functionsDiff = [
    {
      type: 'added',
      name: 'get_employee_by_id',
      description: 'New function to retrieve employee by ID',
    },
  ]

  if (!isBranch || !currentBranch) {
    return (
      <ScaffoldContainer>
        <ScaffoldHeader>
          <ScaffoldTitle>Merge Request</ScaffoldTitle>
        </ScaffoldHeader>
        <div className="p-6">
          <p>This page is only available for preview branches.</p>
        </div>
      </ScaffoldContainer>
    )
  }

  return (
    <ScaffoldContainer>
      <ScaffoldHeader>
        <ScaffoldTitle>Request a merge</ScaffoldTitle>
        <div className="flex items-center gap-2">
          <Button type="default" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="primary" loading={isMerging || isSubmitting} onClick={handleMerge}>
            Open request
          </Button>
        </div>
      </ScaffoldHeader>

      <div className="p-6 space-y-6">
        {/* Warning Card */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800">⚠️ Local schema may be outdated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-700">
              Dashboard changes may not be in your local or GitHub branch.
            </p>
            <div className="mt-2 p-2 bg-gray-800 rounded text-green-400 font-mono text-xs">
              $ supabase db pull --project-ref {ref}
            </div>
          </CardContent>
        </Card>

        {/* Merge Direction */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm">From</span>
                <div className="px-3 py-1 bg-gray-100 rounded border">{currentBranch.name}</div>
                <span className="text-sm">into</span>
                <div className="px-3 py-1 bg-amber-100 rounded border flex items-center gap-2">
                  🛡️ {mainBranch?.name || 'main'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Diff Tabs */}
        <Tabs_Shadcn_ defaultValue="schema" className="w-full">
          <TabsList_Shadcn_ className="grid w-full grid-cols-3">
            <TabsTrigger_Shadcn_ value="schema">Schema</TabsTrigger_Shadcn_>
            <TabsTrigger_Shadcn_ value="config">Config</TabsTrigger_Shadcn_>
            <TabsTrigger_Shadcn_ value="functions">Functions</TabsTrigger_Shadcn_>
          </TabsList_Shadcn_>

          <TabsContent_Shadcn_ value="schema" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>📊 EMPLOYEES</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm">
                  <div className="text-blue-400">CREATE TABLE</div>
                  <div className="ml-4">
                    <span className="text-yellow-300">employees</span> (
                  </div>
                  <div className="ml-8 space-y-1">
                    <div>
                      id <span className="text-purple-300">SERIAL PRIMARY KEY</span>,
                    </div>
                    <div>
                      first_name <span className="text-purple-300">VARCHAR(50) NOT NULL</span>,
                    </div>
                    <div>
                      last_name <span className="text-purple-300">VARCHAR(50) NOT NULL</span>,
                    </div>
                    <div>
                      email <span className="text-purple-300">VARCHAR(100) UNIQUE NOT NULL</span>,
                    </div>
                    <div>
                      phone_number <span className="text-purple-300">VARCHAR(20)</span>,
                    </div>
                    <div>
                      hire_date <span className="text-purple-300">DATE NOT NULL</span>,
                    </div>
                    <div className="bg-green-800 px-1">
                      job_title <span className="text-purple-300">VARCHAR(50) NOT NULL</span>,
                    </div>
                    <div>
                      salary <span className="text-purple-300">NUMERIC(10, 2)</span>,
                    </div>
                    <div>
                      department_id <span className="text-purple-300">INTEGER</span>,
                    </div>
                    <div>
                      created_at{' '}
                      <span className="text-purple-300">TIMESTAMP DEFAULT CURRENT_TIMESTAMP</span>,
                    </div>
                    <div>
                      updated_at{' '}
                      <span className="text-purple-300">TIMESTAMP DEFAULT CURRENT_TIMESTAMP</span>
                    </div>
                  </div>
                  <div className="ml-4">);</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent_Shadcn_>

          <TabsContent_Shadcn_ value="config" className="mt-4">
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No configuration changes detected
              </CardContent>
            </Card>
          </TabsContent_Shadcn_>

          <TabsContent_Shadcn_ value="functions" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>+ get_employee_by_id</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm">
                  <div className="text-green-400">
                    + CREATE OR REPLACE FUNCTION get_employee_by_id(emp_id INTEGER)
                  </div>
                  <div className="text-green-400">
                    + RETURNS TABLE(id INTEGER, name TEXT, title TEXT)
                  </div>
                  <div className="text-green-400">+ LANGUAGE plpgsql</div>
                  <div className="text-green-400">+ AS $$</div>
                  <div className="text-green-400">+ BEGIN</div>
                  <div className="text-green-400">+ RETURN QUERY</div>
                  <div className="text-green-400">
                    + SELECT e.id, CONCAT(e.first_name, ' ', e.last_name), e.job_title
                  </div>
                  <div className="text-green-400">+ FROM employees e</div>
                  <div className="text-green-400">+ WHERE e.id = emp_id;</div>
                  <div className="text-green-400">+ END;</div>
                  <div className="text-green-400">+ $$;</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent_Shadcn_>
        </Tabs_Shadcn_>
      </div>
    </ScaffoldContainer>
  )
}

MergePage.getLayout = (page) => (
  <DefaultLayout>
    <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>
  </DefaultLayout>
)

export default MergePage
