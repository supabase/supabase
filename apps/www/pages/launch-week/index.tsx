import { GetStaticProps } from 'next'
import Error404 from '../404'

export default function LaunchWeekIndex() {
  return <Error404 />
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const redirectUrl = `/special-announcement`
  return {
    redirect: {
      permanent: false,
      destination: redirectUrl,
    },
  }
}
