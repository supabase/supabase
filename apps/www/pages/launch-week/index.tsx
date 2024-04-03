import { GetStaticProps } from 'next'
import Error404 from '../404'

export default function LaunchWeekIndex() {
  return <Error404 />
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const redirectUrl = `/special-announcement`

  if (process.env.npm_lifecycle_event === 'build') {
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
