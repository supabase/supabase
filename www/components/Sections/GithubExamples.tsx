import { useRouter } from 'next/router'
import { Swiper, SwiperSlide } from 'swiper/react'

import SectionContainer from '../Layouts/SectionContainer'
import { Typography, IconGitHub } from '@supabase/ui'

import Examples from '../../data/Examples.json'
import ExampleCard from '../ExampleCard'

function GithubExamples() {
  // base path for images
  const { basePath } = useRouter()
  return (
    <>
      <div className="grid grid-cols-12">
        <div className="col-span-12 text-center">
          <Typography.Title level={2}>
            Community driven examples, libaries and guides
          </Typography.Title>
          <Typography.Text>
            <p className="text-lg">Type definitions for both server side and client side </p>
          </Typography.Text>
        </div>
      </div>

      <div className="mt-16">
        <div className={'-mr-32 -ml-32'}>
          <Swiper
            style={{ overflow: 'visible' }}
            initialSlide={3}
            spaceBetween={0}
            slidesPerView={4}
            autoplay={{
              delay: 2400,
            }}
            loop={true}
            speed={2400}
          >
            {Object.values(Examples).map((example: any, i: number) => {
              return (
                <SwiperSlide>
                  <div className="my-8 mr-3 ml-3">
                    <ExampleCard i={i} {...example} />
                  </div>
                </SwiperSlide>
              )
            })}
          </Swiper>
        </div>
      </div>
    </>
  )
}

export default GithubExamples
