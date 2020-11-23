import Container from '../components/container'
import Hero from '../components/hero'
import Layout from '../components/layout'
import Head from 'next/head'
import { CMS_NAME } from '../lib/constants'

type Props = {
  
}

const Index = ({  }: Props) => {
  return (
    <>
      <Layout>
        <Head>
          <title>{CMS_NAME}</title>
        </Head>
        <Container>
          <Hero />
        </Container>
      </Layout>
    </>
  )
}

export default Index
