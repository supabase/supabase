import { GetStaticProps, GetStaticPaths } from 'next'
import Error404 from '../../404'

export default function UsernamePage() {
  return <Error404 />
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const username = params?.username?.toString() || null
  const redirectUrl = `/special-announcement/tickets/${username}`

  if (!username || process.env.npm_lifecycle_event === 'build') {
    return {
      notFound: true,
    }
  }

  return {
    redirect: {
      permanent: false,
      destination: redirectUrl,
    },
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  return Promise.resolve({
    paths: [],
    fallback: 'blocking',
  })
}
