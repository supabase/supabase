import type { GetServerSideProps } from 'next'
import supabase from '~/lib/supabaseMisc'
import Error404 from '../404'
import { API_URL } from '~/lib/constants'
import type { IntegrationsDirectoryEntry } from './integrations'

function PartnerPage() {
  // Should be redirected to ./experts/:slug or ./integrations/:slug
  return <Error404 />
}

export const getServerSideProps: GetServerSideProps = async ({ params, query }) => {
  // Try new integrations directory first, and bail to the old solution if entry is not present.
  const url = `${API_URL}/integrations-directory/${params!.slug}${query.preview_token ? `?preview_token=${query.preview_token}` : ''}`
  const response = await fetch(url)
  const entry = (await response.json()) as IntegrationsDirectoryEntry

  if (entry && response.status === 200) {
    return {
      redirect: {
        permanent: false,
        destination: `/partners/integrations/${entry.slug}${query.preview_token ? `?preview_token=${query.preview_token}` : ''}`,
      },
    }
  }

  let { data: partner } = await supabase
    .from('partners')
    .select('*')
    .eq('approved', true)
    .eq('slug', params!.slug as string)
    .single()

  if (!partner || process.env.npm_lifecycle_event === 'build') {
    return {
      notFound: true,
    }
  }

  let redirectUrl: string
  switch (partner.type) {
    case 'technology':
      redirectUrl = `/partners/integrations/${partner.slug}`
      break
    case 'expert':
      redirectUrl = `/partners/experts/${partner.slug}`
      break
  }

  return {
    redirect: {
      permanent: false,
      destination: redirectUrl,
    },
  }
}

export default PartnerPage
