import { useRouter } from 'next/router'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Button, Typography, IconMessageCircle, Space } from '@supabase/ui'

import Examples from '../../data/tweets/Tweets.json'
import TweetCard from '../TweetCard'

function TwitterSocialProof() {
  // base path for images
  const { basePath } = useRouter()
  return (
    <>
      <div className="grid grid-cols-12">
        <div className="col-span-12 text-center">
          <Typography.Title level={2}>Join the community</Typography.Title>
          <Typography.Text>
            <p className="text-lg">
              The Supabase team is overwhelmed with the support from early advocates, contributors,
              and champions.
              <br />
              Supabase would not be possible without them.
            </p>
            <Space className="justify-center mt-8">
              <Button size="small" iconRight={<IconMessageCircle size="tiny" />} type="default">
                GitHub discussions
              </Button>
            </Space>
          </Typography.Text>
        </div>
      </div>

      <div className="mt-6">
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
            {Examples.map((tweet: any, i: number) => {
              return (
                <SwiperSlide>
                  <div className="mr-3 ml-3 my-8 ">
                    <TweetCard
                      key={i}
                      handle={`@${tweet.handle}`}
                      quote={tweet.text}
                      img_url={`${basePath}${tweet.img_url}`}
                    />
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

export default TwitterSocialProof
