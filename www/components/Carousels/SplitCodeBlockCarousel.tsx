import { useState } from 'react'
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react'

import { Tabs, Typography, Button } from '@supabase/ui'
import CodeBlock from '../CodeBlock/CodeBlock'

// Import Swiper styles
import 'swiper/swiper.min.css'

function SplitCodeBlockCarousel() {
  // store API swiper instance
  const [apiSwiper, setApiSwiper] = useState(undefined)
  const [swiperDetails, setSwiperDetails] = useState(undefined)

  const [apiSwiperActiveIndex, setApiSwiperActiveIndex] = useState(0)

  function handleApiSwiperNavChange(e: number) {
    setApiSwiperActiveIndex(e)
    // @ts-ignore
    apiSwiper.slideTo(e)
    // @ts-ignore
    swiperDetails.slideTo(e)
  }

  const details = (
    <div className="">
      <Typography.Text>
        <span className="block text-white mb-8">Allow fetch something</span>
      </Typography.Text>
      <Typography.Text type="secondary">
        <p>
          This would only allow the authenticated user access to a folder that is named after their
          own account UID. This is useful for things like profile images.
        </p>
      </Typography.Text>
      <Typography.Text>
        <Button type="outline">View documentation</Button>
      </Typography.Text>
    </div>
  )

  return (
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
          autoHeight={true}
          allowTouchMove={false}
        >
          <SwiperSlide>
            <CodeBlock lang="sql">
              {`-- Secure the tables
alter table public.users enable row level security;
alter table public.channels enable row level security;
alter table public.messages enable row level security;
create policy "Allow logged-in read access" on public.users for select using ( auth.role() = 'authenticated' );
create policy "Allow individual insert access" on public.users for insert with check ( auth.uid() = id );
create policy "Allow individual update access" on public.users for update using ( auth.uid() = id );
`}
            </CodeBlock>
          </SwiperSlide>
          <SwiperSlide>
            <CodeBlock lang="sql">
              {`-- Secure the tables
alter table public.users enable row level security;
alter table public.channels enable row level security;
alter table public.messages enable row level security;
`}
            </CodeBlock>
          </SwiperSlide>
          <SwiperSlide>
            <CodeBlock lang="sql">
              {`-- Secure the tables
alter table public.users enable row level security;
alter table public.channels enable row level security;
alter table public.messages enable row level security;
`}
            </CodeBlock>
          </SwiperSlide>
          <SwiperSlide>
            <CodeBlock lang="sql">
              {`-- Secure the tables
alter table public.users enable row level security;
alter table public.channels enable row level security;
alter table public.messages enable row level security;
`}
            </CodeBlock>
          </SwiperSlide>
          <SwiperSlide>
            <CodeBlock lang="sql">
              {`-- Secure the tables
alter table public.users enable row level security;
alter table public.channels enable row level security;
alter table public.messages enable row level security;
`}
            </CodeBlock>
          </SwiperSlide>
          <SwiperSlide>
            <CodeBlock lang="sql">
              {`-- Secure the tables
alter table public.users enable row level security;
alter table public.channels enable row level security;
alter table public.messages enable row level security;
`}
            </CodeBlock>
          </SwiperSlide>
        </Swiper>

        <div className="overflow-hidden bg-gray-900 p-8 dark rounded-md border border-t-none border-t-0 border-gray-600">
          <Swiper
            // @ts-ignore
            onSwiper={setSwiperDetails}
            style={{ zIndex: 0 }}
            initialSlide={2}
            spaceBetween={0}
            slidesPerView={1}
            direction="horizontal"
            // style={{ overflow: 'hidden' }}
            speed={800}
            allowTouchMove={false}
          >
            <SwiperSlide>{details}</SwiperSlide>
            <SwiperSlide>{details}</SwiperSlide>
            <SwiperSlide>{details}</SwiperSlide>
            <SwiperSlide>{details}</SwiperSlide>
            <SwiperSlide>{details}</SwiperSlide>
            <SwiperSlide>{details}</SwiperSlide>
          </Swiper>
        </div>
      </div>
    </div>
  )
}

export default SplitCodeBlockCarousel
