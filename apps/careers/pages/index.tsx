import type { NextPage } from 'next'
import Head from 'next/head'
import Nav from '../components/Nav'
import Hero from '../components/Hero'
import Culture from '../components/Culture'
import Join from '../components/Join'
import Video from '../components/Video'
import Positions from '../components/Positions'

const Home: NextPage = () => {
  return (
    <div className="mx-8 mt-6 sm:mx-12 md:mx-auto md:max-w-screen-lg">
      <Nav />
      <Hero />
      <Culture />
      <Join />
      <Video />
      <Positions />
    </div>
  )
}

export default Home
