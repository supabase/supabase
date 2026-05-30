import { GetStaticPaths, GetStaticProps } from 'next'
import supabase from '~/lib/supabaseMisc'
import Error404 from '../404'

function PartnerPage() {
  // Existing short partner URLs redirect to their current integration pages.
  return <Error404 />
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking',
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  let { data: partner } = await supabase
    .from('partners')
    .select('*')
    .eq('approved', true)
    .eq('slug', params!.slug as string)
    .single()

  if (!partner || partner.type === 'expert') {
    return {
      notFound: true,
    }
  }

  return {
    redirect: {
      permanent: false,
      destination: `/partners/integrations/${partner.slug}`,
    },
  }
}

export default PartnerPage
