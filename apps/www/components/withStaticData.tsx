import { NextPage } from 'next'
import React from 'react'
import { getSortedPosts } from '../lib/posts'

const withStaticData = (Component: NextPage | any) => {
  console.log('withStaticData Component', Component)
  const WithStaticData = (props: any) => {
    console.log('WithStaticData props', props)

    const InnerComponent = Component
    return <InnerComponent {...props} />
  }

  WithStaticData.displayName = `withStaticData(${Component.displayName})`

  return WithStaticData
}

export async function getStaticProps() {
  const allPostsData = getSortedPosts({ directory: '_blog', runner: '** BLOG PAGE **' })
  console.log('getStaticProps =====')
  return {
    props: {
      blogs: allPostsData,
    },
  }
}

export default withStaticData
