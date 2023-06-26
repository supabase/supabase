import { useEffect, useMemo, useState } from 'react'

import { useParams } from 'common'
import ProjectLinker from 'components/interfaces/Integrations/ProjectLinker'

import { Markdown } from 'components/interfaces/Markdown'
import IntegrationWindowLayout from 'components/layouts/IntegrationWindowLayout'
import { ScaffoldContainer, ScaffoldDivider } from 'components/layouts/Scaffold'
import OrganizationPicker from 'components/ui/OrganizationPicker'
import { useIntegrationsQuery } from 'data/integrations/integrations-query'
import { useVercelProjectsQuery } from 'data/integrations/integrations-vercel-projects-query'
import { useVercelIntegrationCreateMutation } from 'data/integrations/vercel-integration-create-mutation'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useStore } from 'hooks'
import { EMPTY_ARR } from 'lib/void'
import { NextPageWithLayout, Organization } from 'types'
import { Alert, Button, IconBook, IconLifeBuoy, LoadingLine } from 'ui'
import { useRouter } from 'next/router'

const VercelIntegration: NextPageWithLayout = () => {
  const router = useRouter()

  useEffect(() => {
    router.push({ pathname: '/integrations/vercel/install', query: router.query })
  }, [router])

  return <></>
}

VercelIntegration.getLayout = (page) => <IntegrationWindowLayout>{page}</IntegrationWindowLayout>

export default VercelIntegration
