import React from 'react'
import ArticleThumb from './../ArticleThumb'
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
            <small>Enterprise solutions</small>
            <h2 className="text-3xl tracking-tight font-extrabold text-gray-900 sm:text-4xl">
              We’re ready to help scale your business
            </h2>
            <p className="mt-3 mx-auto text-xl text-gray-500 sm:mt-4">
              Lorem ipsum dolor sit amet consectetur, adipisicing elit. Ipsa libero labore natus
              atque, ducimus sed.
            </p>
          </div>
          <div className="mt-12 max-w-lg mx-auto grid gap-5 lg:grid-cols-3 lg:max-w-none">
            <ArticleThumb article={
              // @ts-ignore
              CaseStudiesData["monitoro"]
              }/>
              <ArticleThumb article={
              // @ts-ignore
              CaseStudiesData["tayfab"]
              }/>
              <ArticleThumb article={
              // @ts-ignore
              CaseStudiesData["llama_lab"]
              }/>
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
