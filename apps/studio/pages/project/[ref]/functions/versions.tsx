import { EdgeFunctionVersionsList } from 'components/interfaces/Functions/EdgeFunctionVersions/version-list'
import DefaultLayout from 'components/layouts/DefaultLayout'
import EdgeFunctionsLayout from 'components/layouts/EdgeFunctionsLayout/EdgeFunctionsLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import {
  ScaffoldContainer,
  ScaffoldHeader,
  ScaffoldSectionTitle,
  ScaffoldSection,
} from 'components/layouts/Scaffold'
import { DocsButton } from 'components/ui/DocsButton'
import { Download, FileArchive, Send } from 'lucide-react'
import type { NextPageWithLayout } from 'types'
import {
  Button,
  Popover_Shadcn_,
  Separator,
  PopoverTrigger_Shadcn_,
  PopoverContent_Shadcn_,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

const VersionsPage: NextPageWithLayout = () => {
  return (
    <ScaffoldSection isFullWidth>
      <div className="px-6">
        <ScaffoldContainer className="max-w-full px-0 @lg:px-0 @xl:px-0">
          <ScaffoldHeader className="py-0 flex flex-row items-center justify-between">
            <ScaffoldSectionTitle className="mb-0">Deployments</ScaffoldSectionTitle>
          </ScaffoldHeader>
          <ScaffoldSection>
            <div className="col-span-12">
              <EdgeFunctionVersionsList />
            </div>
          </ScaffoldSection>
        </ScaffoldContainer>
      </div>
    </ScaffoldSection>
  )
}

VersionsPage.getLayout = (page) => {
  const breadcrumbItems = [
    {
      label: 'Edge Functions',
      href: `/project/default/functions`,
    },
  ]

  const functionSlug = 'demo-functions'
  const ref = 'default'

  const navigationItems = functionSlug
    ? [
        {
          label: 'Overview',
          href: `/project/${ref}/functions/${functionSlug}`,
        },
        {
          label: 'Invocations',
          href: `/project/${ref}/functions/${functionSlug}/invocations`,
        },
        {
          label: 'Logs',
          href: `/project/${ref}/functions/${functionSlug}/logs`,
        },
        {
          label: 'Code',
          href: `/project/${ref}/functions/${functionSlug}/code`,
        },
        {
          label: 'Details',
          href: `/project/${ref}/functions/${functionSlug}/details`,
        },
        {
          label: 'Deployments',
          href: `/project/${ref}/functions/versions`,
        },
      ]
    : []

  return (
    <DefaultLayout>
      <EdgeFunctionsLayout>
        <PageLayout
          title={functionSlug}
          breadcrumbs={breadcrumbItems}
          navigationItems={navigationItems}
          isCompact
          size="full"
          primaryActions={
            <div className="flex items-center space-x-2">
              <DocsButton href="https://supabase.com/docs/guides/functions" />
              <Popover_Shadcn_>
                <PopoverTrigger_Shadcn_ asChild>
                  <Button type="default" icon={<Download />}>
                    Download
                  </Button>
                </PopoverTrigger_Shadcn_>
                <PopoverContent_Shadcn_ align="end" className="p-0">
                  <div className="p-3 flex flex-col gap-y-2">
                    <p className="text-xs text-foreground-light">Download via CLI</p>
                    <Input
                      copy
                      showCopyOnHover
                      readOnly
                      containerClassName=""
                      className="text-xs font-mono tracking-tighter"
                      value={`supabase functions download ${functionSlug}`}
                    />
                  </div>
                  <Separator className="!bg-border-overlay" />
                  <div className="py-2 px-1">
                    <Button
                      type="text"
                      className="w-min hover:bg-transparent"
                      icon={<FileArchive />}
                    >
                      Download as ZIP
                    </Button>
                  </div>
                </PopoverContent_Shadcn_>
              </Popover_Shadcn_>
              {!!functionSlug && (
                <Button type="default" icon={<Send />}>
                  Test
                </Button>
              )}
            </div>
          }
        >
          {page}
        </PageLayout>
      </EdgeFunctionsLayout>
    </DefaultLayout>
  )
}

export default VersionsPage
