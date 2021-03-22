import { useState } from 'react'
// Import Swiper React components
import { Button, IconBriefcase, IconEye, Tabs, Typography } from '@supabase/ui'
import { Swiper, SwiperSlide } from 'swiper/react'
import CodeBlock from '../CodeBlock/CodeBlock'
import FeatureColumn from '../FeatureColumn'

function APISection() {
  // store API swiper instance
  const [apiSwiper, setApiSwiper] = useState(undefined)
  const [apiSwiperActiveIndex, setApiSwiperActiveIndex] = useState(0)

  function handleApiSwiperNavChange(e: number) {
    setApiSwiperActiveIndex(e)
    // @ts-ignore
    apiSwiper.slideTo(e)
  }

  return (
    <div className="grid grid-cols-12 lg:gap-16">
      <div className="col-span-12 lg:col-span-5">
        <Typography.Title level={2}>
          Sleek dashboard
          <br /> for managing your media
        </Typography.Title>
        <p className="text-lg">
          An API built from the groud up for server and client side authentication that is fast to
          implement.
        </p>
        <p className="text-lg">
          With powerful library clients coming soon that allow for asset optimasation and image
          transformation
        </p>
        <Button size="small" className="mt-4">
          Expore documentation
        </Button>
        <div className="grid grid-cols-12 gap-16 mt-8">
          <div className="col-span-4">
            <FeatureColumn
              icon={<IconBriefcase />}
              title="Enterprise logins"
              text="Type definitions for both server side and client side"
            />
          </div>
          <div className="col-span-4">
            <FeatureColumn
              icon={<IconEye />}
              title="Social login scopes"
              text="Request additonal user data permissions when using social logins"
            />
          </div>
        </div>
      </div>
      <div className="col-span-12 lg:col-span-6 lg:col-start-7">
        <Tabs
          scrollable
          // @ts-ignore
          activeId={apiSwiperActiveIndex.toString()}
          // @ts-ignore
          onChange={(id: string) => handleApiSwiperNavChange(Number(id))}
        >
          <Tabs.Panel label="Fast column navigation" id="0">
            <span></span>
          </Tabs.Panel>
          <Tabs.Panel label="Fast column navigation" id="1">
            <span></span>
          </Tabs.Panel>
          <Tabs.Panel label="Fast column navigation" id="2">
            <span></span>
          </Tabs.Panel>
          <Tabs.Panel label="Fast column navigation" id="3">
            <span></span>
          </Tabs.Panel>
          <Tabs.Panel label="Fast column navigation" id="4">
            <span></span>
          </Tabs.Panel>
          <Tabs.Panel label="Fast column navigation" id="5">
            <span></span>
          </Tabs.Panel>
        </Tabs>
        <div className="border border-gray-100 dark:border-gray-600 rounded-md bg-gray-800 overflow-hidden">
          <Swiper
            // @ts-ignore
            onSwiper={setApiSwiper}
            style={{ zIndex: 0 }}
            initialSlide={apiSwiperActiveIndex}
            spaceBetween={0}
            slidesPerView={1}
            speed={800}
            allowTouchMove={false}
          >
            <SwiperSlide>
              <CodeBlock lang="js">
                {`import { createClient } from '@supabase/supabase-js'

// Initialize 
const supabaseUrl = 'https://chat-room.supabase.co'
const supabaseKey = 'public-anon-key'
const supabase = createClient(supabaseUrl, supabaseKey)
  
// Create a new user
const { user, error } = await supabase.auth.signUp({
  email: 'example@email.com',
  password: 'example-password',
})










`}
              </CodeBlock>
            </SwiperSlide>
            <SwiperSlide>
              <CodeBlock lang="js">
                {`import { createClient } from '@supabase/supabase-js'

// Initialize 2nd ONE
const supabaseUrl = 'https://chat-room.supabase.co'
const supabaseKey = 'public-anon-key'
const supabase = createClient(supabaseUrl, supabaseKey)
  
// Create a new user
const { user, error } = await supabase.auth.signUp({
  email: 'example@email.com',
  password: 'example-password',
})










`}
              </CodeBlock>
            </SwiperSlide>
            <SwiperSlide>
              <CodeBlock lang="js">
                {`import { createClient } from '@supabase/supabase-js'

// Initialize 2nd ONE
const supabaseUrl = 'https://chat-room.supabase.co'
const supabaseKey = 'public-anon-key'
const supabase = createClient(supabaseUrl, supabaseKey)
  
// Create a new user
const { user, error } = await supabase.auth.signUp({
  email: 'example@email.com',
  password: 'example-password',
})










`}
              </CodeBlock>
            </SwiperSlide>
            <SwiperSlide>
              <CodeBlock lang="js">
                {`import { createClient } from '@supabase/supabase-js'

// Initialize 2nd ONE
const supabaseUrl = 'https://chat-room.supabase.co'
const supabaseKey = 'public-anon-key'
const supabase = createClient(supabaseUrl, supabaseKey)
  
// Create a new user
const { user, error } = await supabase.auth.signUp({
  email: 'example@email.com',
  password: 'example-password',
})










`}
              </CodeBlock>
            </SwiperSlide>
            <SwiperSlide>
              <CodeBlock lang="js">
                {`import { createClient } from '@supabase/supabase-js'

// Initialize 2nd ONE
const supabaseUrl = 'https://chat-room.supabase.co'
const supabaseKey = 'public-anon-key'
const supabase = createClient(supabaseUrl, supabaseKey)
  
// Create a new user
const { user, error } = await supabase.auth.signUp({
  email: 'example@email.com',
  password: 'example-password',
})










`}
              </CodeBlock>
            </SwiperSlide>
            <SwiperSlide>
              <CodeBlock lang="js">
                {`import { createClient } from '@supabase/supabase-js'

// Initialize 2nd ONE
const supabaseUrl = 'https://chat-room.supabase.co'
const supabaseKey = 'public-anon-key'
const supabase = createClient(supabaseUrl, supabaseKey)
  
// Create a new user
const { user, error } = await supabase.auth.signUp({
  email: 'example@email.com',
  password: 'example-password',
})










`}
              </CodeBlock>
            </SwiperSlide>
          </Swiper>
        </div>
      </div>
    </div>
  )
}

export default APISection
