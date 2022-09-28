import type { NextPage } from 'next'
import Head from 'next/head'
import Layout from '../components/Layout'
import Hero from '../components/Hero'
import Culture from '../components/Culture'
import Join from '../components/Join'
import Video from '../components/Video'
import Positions from '../components/Positions'

const Home: NextPage = () => {
  return (
    <Layout>
      <Hero />
      <Culture />
      <Join />
      <Video />
      <Positions />
    </Layout>
  )
}

export default Home
