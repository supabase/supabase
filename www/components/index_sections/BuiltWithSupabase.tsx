import React from 'react'
import ArticleThumb from './../ArticleThumb'
import ProjectExamples from "./../../data/ProjectExamples.json"
import SectionHeader from '../UI/SectionHeader'

const BuiltExamples = () => {
  return (
    <React.Fragment>
      <div className="relative bg-gray-50 pt-16 pb-16 px-4 sm:px-6 lg:pt-24 lg:pb-28 lg:px-8 sm:px-6 lg:px-16">
        <div className="absolute inset-0">
          <div className="bg-white h-1/3 sm:h-2/3"></div>
        </div>
        <div className="mx-auto max-w-7xl">
        <SectionHeader title={'What you can build'}
        title_alt={' with Supabase'} 
        subtitle={'Built with supabase'} 
        />
        </div>
        {/* <div className="relative max-w-7xl mx-auto">
          <div>
            <small>Built with supabase</small>
            <h2 className="text-3xl tracking-tight text-gray-900 sm:text-4xl">
              What you can build with Supabase
            </h2>
            <p className="mt-3 mx-auto text-xl text-gray-500 sm:mt-4">
              Lorem ipsum dolor sit amet consectetur, adipisicing elit. Ipsa libero labore natus
              atque, ducimus sed.
            </p>
          </div>
        </div> */}
          <div className="relative max-w-7xl mx-auto">
          <div className="mt-12 max-w-lg mx-auto grid gap-5 lg:grid-cols-3 lg:max-w-none">
            <ArticleThumb article={
              // @ts-ignore
              ProjectExamples["vercel_and_stripe"]
              }/>
              <ArticleThumb article={
              // @ts-ignore
              ProjectExamples["nextjs-slack-clone"]
              }/>
          </div>
        </div>
      </div>
    </React.Fragment>
  )
}

export default BuiltExamples
