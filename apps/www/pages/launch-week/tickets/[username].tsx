import { GetStaticProps, GetStaticPaths } from 'next'

export default function UsernamePage() {
  return null
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const username = params?.username?.toString() || null
  const redirectUrl = `/special-announcement/tickets/${username}`

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
