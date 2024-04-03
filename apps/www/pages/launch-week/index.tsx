import { GetStaticProps } from 'next'

export default function LaunchWeekIndex() {
  return null
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
