import { NextPage } from 'next'
import React from 'react'
import { getSortedPosts } from '../lib/posts'
import { MDXProviderComponents } from '@mdx-js/react'

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

export default withStaticData
