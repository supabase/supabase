import React from 'react'
import Button from '../button'
import ArticleThumb from './../ArticleThumb'
import SectionHeader from '../UI/SectionHeader'
import CaseStudiesData from "./../../data/CaseStudies.json"

const CaseStudies = () => {

  return (
    <React.Fragment>
      <div className="relative bg-gray-50 pt-16 pb-20 px-4 sm:px-6 lg:pt-24 lg:pb-28 lg:px-8">
        <div className="absolute inset-0">
          <div className="bg-white h-1/3 sm:h-2/3"></div>
        </div>
        <div className="relative max-w-7xl mx-auto">
          <div>
            <SectionHeader
              title={'We\'re ready to help scale your business'}
              subtitle={'Enterprise Solutions'}
              paragraph={'Supabase has already been supporting many companies in production, from monitoring applications to social networks. '}
            />
          </div>
          <div className="mt-5 max-w-lg mx-auto grid gap-5 lg:grid-cols-3 lg:max-w-none">
            <ArticleThumb article={CaseStudiesData["monitoro"]} />
            <ArticleThumb article={CaseStudiesData["tayfab"]} />
            <ArticleThumb article={CaseStudiesData["llama_lab"]} />
          </div>
        </div>
      </div>

      <div className="bg-white pt-16 pb-4 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-12 gap-4 items-center shadow-md rounded-md">
          <div className="w-full h-full col-span-2 bg-gray-300 rounded-l-md"></div>
          <div className="col-span-6 py-6 ml-4">
            <p className="text-xl">Record breaking speed and reliability</p>
            <p className="text-gray-400 mt-2">
              <span className="block">Supabase is already enterprise level and we’re blown away by the speed!</span>
              <span className="block">Sign up for our public benchmark release and we’ll email it to you</span>
            </p>
          </div>
          <div className="col-span-2" />
          <div className="col-span-2 rounded-r-md">
            <Button text="Get notified" url="#"/>
          </div>
        </div>
      </div>

      <div className="bg-white">
        <div className="mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-700 rounded-lg shadow-xl overflow-hidden lg:grid lg:grid-cols-12 lg:gap-4">
            <div className="pt-10 pb-12 px-6 sm:pt-16 sm:px-16 lg:py-16 lg:pr-0 xl:py-20 xl:px-20 col-span-8">
              <div className="lg:self-center">
                <h4 className="text-5xl font-bold text-white sm:text-2xl">
                  <span className="block">Record breaking speed and reliability</span>
                </h4>
                <p className="mt-4 text-base text-gray-200">
                <span className="block">Supabase is already enterprise level and we’re blown away by the speed!</span>
                <span className="block">Sign up for our public benchmark release and we’ll email it to you</span>
                </p>
                <p className="mt-4 text-base text-gray-200">
                </p>
                <button
                  type="button"
                  className="mt-1 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
                >
                  Button text
                </button>
              </div>
            </div>
            <div className="-mt-6 aspect-w-5 aspect-h-3 md:aspect-w-2 md:aspect-h-1 col-span-4">
              <img
                className="transform translate-x-6 translate-y-6 rounded-md object-cover object-left-top sm:translate-x-16 lg:translate-y-20"
                src="https://tailwindui.com/img/component-images/full-width-with-sidebar.jpg"
                alt="App screenshot"
              />
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  )
}

export default CaseStudies
