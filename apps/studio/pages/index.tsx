import type { GetServerSideProps } from 'next'

// Root page — redirect to the projects landing page
const IndexPage = () => null

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/projects',
      permanent: false,
    },
  }
}

export default IndexPage
