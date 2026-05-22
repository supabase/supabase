import { useParams } from 'common'
import Link from 'next/link'
import type { PropsWithChildren } from 'react'
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from 'ui'
import { PageBreadcrumbs, PageBreadcrumbsActions } from 'ui-patterns/PageBreadcrumbs'
import { PageContainer } from 'ui-patterns/PageContainer'

import AuthLayout from './AuthLayout'
import { EmailTemplateEditorProvider } from '@/components/interfaces/Auth/EmailTemplates/EmailTemplateEditorContext'
import type { AuthTemplate } from '@/components/interfaces/Auth/EmailTemplates/EmailTemplates.types'
import { TemplateVariablesPopover } from '@/components/interfaces/Auth/EmailTemplates/TemplateVariablesPopover'
import { DocsButton } from '@/components/ui/DocsButton'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

interface AuthEmailTemplateLayoutProps {
  templateTitle: string
  docsHref: string
  template: AuthTemplate
}

export const AuthEmailTemplateLayout = ({
  templateTitle,
  docsHref,
  template,
  children,
}: PropsWithChildren<AuthEmailTemplateLayoutProps>) => {
  const { ref } = useParams()
  const showEmails = useIsFeatureEnabled('authentication:emails')

  return (
    <AuthLayout title="Emails">
      {showEmails ? (
        <EmailTemplateEditorProvider>
          <div className="flex h-full min-h-0 w-full flex-1 flex-col items-stretch">
            <PageBreadcrumbs
              actions={
                <PageBreadcrumbsActions>
                  <TemplateVariablesPopover template={template} />
                  <DocsButton href={docsHref} />
                </PageBreadcrumbsActions>
              }
            >
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={`/project/${ref}/auth/templates`}>Emails</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{templateTitle}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </PageBreadcrumbs>

            <PageContainer size="full" className="flex flex-1 min-h-0 flex-col px-0 xl:px-0">
              {children}
            </PageContainer>
          </div>
        </EmailTemplateEditorProvider>
      ) : (
        <UnknownInterface urlBack={`/project/${ref}/auth/overview`} />
      )}
    </AuthLayout>
  )
}
