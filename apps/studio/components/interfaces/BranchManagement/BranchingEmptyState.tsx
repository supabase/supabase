import { useParams } from 'common'
import { GitBranch } from 'lucide-react'
import Link from 'next/link'
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from 'ui'

import { IntegrationSectionIcon } from '../Settings/Integrations/IntegrationsSettings'
import { CreateBranchButton } from './CreateBranchButton'
import { DocsButton } from '@/components/ui/DocsButton'
import { DOCS_URL } from '@/lib/constants'

export const BranchingEmptyState = ({
  isGithubConnected = false,
}: {
  isGithubConnected?: boolean
}) => {
  const { ref } = useParams()
  return (
    <Card>
      <CardHeader>
        <CardTitle>Get started with branching</CardTitle>
        <CardDescription>
          Create isolated environments to test changes before merging to production
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x items-stretch">
        <div className="p-8">
          <div className="flex items-start gap-x-4">
            <div className="shrink-0 text-foreground-light">
              <Card className="flex h-10 w-10 shrink-0 items-center justify-center p-0">
                <GitBranch size={16} />
              </Card>
            </div>
            <div className="text-sm">
              <p className="space-x-2">Create a preview branch</p>
              <p className="text-foreground-light text-balance mt-1 mb-4">
                Make schema or Edge Function changes on a clone of your project, then merge them
                back when ready.
              </p>
              <div className="flex items-center gap-x-2">
                <CreateBranchButton />
                <DocsButton
                  label="Learn more"
                  topic="Branching via the dashboard"
                  href={`${DOCS_URL}/deployment/branching/dashboard`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="flex items-start gap-x-4">
            <IntegrationSectionIcon title="github" className=" h-10 w-10" />
            <div className="text-sm">
              <p className="space-x-2">
                <span>Connect with GitHub</span>
                {isGithubConnected ? (
                  <Badge variant="success" className="-translate-y-px">
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="default" className="-translate-y-px">
                    Optional
                  </Badge>
                )}
              </p>
              <p className="text-foreground-light text-balance mt-1 mb-4">
                Automatically create a preview branch for each pull request and apply your
                migrations on every commit.
              </p>
              <div className="flex items-center gap-x-2">
                {!isGithubConnected && (
                  <Button asChild>
                    <Link href={`/project/${ref}/settings/integrations`}>Connect GitHub</Link>
                  </Button>
                )}
                <DocsButton
                  label="Learn more"
                  topic="Branching GitHub integration"
                  href={`${DOCS_URL}/deployment/branching/github-integration`}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
