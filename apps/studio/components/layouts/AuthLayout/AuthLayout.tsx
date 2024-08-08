import { useParams } from 'common'
import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { useIsColumnLevelPrivilegesEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { ProductMenu } from 'components/ui/ProductMenu'
import { useAuthConfigPrefetch } from 'data/auth/auth-config-query'
import { withAuth } from 'hooks/misc/withAuth'
import Link from 'next/link'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button } from 'ui'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import { generateAuthMenu } from './AuthLayout.utils'

export interface AuthLayoutProps {
  title?: string
}

const AuthProductMenu = () => {
  const { ref: projectRef = 'default' } = useParams()
  const columnLevelPrivileges = useIsColumnLevelPrivilegesEnabled()

  useAuthConfigPrefetch({ projectRef })

  const router = useRouter()
  const page = router.pathname.split('/')[4]

  return (
    <>
      <ProductMenu page={page} menu={generateAuthMenu(projectRef)} />
      {columnLevelPrivileges && (
        <div className="px-3">
          <Alert_Shadcn_>
            <AlertTitle_Shadcn_ className="text-sm">
              Column Privileges has been shifted
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_ className="text-xs">
              <p className="mb-2">It can now be found in the menu under the database section.</p>
              <Button asChild type="default" size="tiny">
                <Link href={`/project/${projectRef}/database/column-privileges`}>
                  Head over to Database
                </Link>
              </Button>
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        </div>
      )}
    </>
  )
}

const AuthLayout = ({ title, children }: PropsWithChildren<AuthLayoutProps>) => {
  return (
    <ProjectLayout
      title={title || 'Authentication'}
      product="Authentication"
      productMenu={<AuthProductMenu />}
      isBlocking={false}
    >
      <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
        {children}
      </main>
    </ProjectLayout>
  )
}

export default withAuth(AuthLayout)
