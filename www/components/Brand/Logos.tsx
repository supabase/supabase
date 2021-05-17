import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Button, Card, Auth, Space, Tabs, Typography, IconCopy, IconDownload } from '@supabase/ui'
import CodeBlock from '../CodeBlock/CodeBlock'
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react'
import Link from 'next/link'
import { useRouter } from 'next/router'

function AuthComponentExample() {
	const { basePath } = useRouter()

  // store API swiper instance
  const [imageSwiper, setImageSwiper] = useState(undefined)
  const [imageSwiperActiveIndex, setImageSwiperActiveIndex] = useState(0)

  function handleNavChange(e: number) {
    console.log(e)
    setImageSwiperActiveIndex(e)
    // @ts-ignore
    imageSwiper.slideTo(e)
  }

  const AuthContainer = (props: any) => {
    const { user } = Auth.useUser()
    if (user) {
      return (
        <>
          <Typography.Text>Signed in: {user.email}</Typography.Text>
          <Button block onClick={() => props.supabaseClient.auth.signOut()}>
            Sign out
          </Button>
        </>
      )
    }
    return props.children
  }

  return (
    <div className="sbui-tabs--alt">
      {/* <Tabs
        activeId={imageSwiperActiveIndex.toString()}
        onChange={(id: string) => handleNavChange(Number(id))}
      >
        <Tabs.Panel label="Preview" id="0" icon={<IconSearch />}>
          <span></span>
        </Tabs.Panel>
        <Tabs.Panel label="Code" icon={<IconCode />} id="1">
          <span></span>
        </Tabs.Panel>
      </Tabs> */}
      <div
        className={`relative bg-white dark:bg-gray-800 py-2 pb-16 border dark:border-gray-600 auth-container`}
      >
        <Swiper
          // @ts-ignore
          onSwiper={setImageSwiper}
          style={{ zIndex: 0 }}
          initialSlide={0}
          spaceBetween={0}
          slidesPerView={1}
          speed={300}
          autoHeight={true}
          allowTouchMove={false}
        >
          <SwiperSlide key={1}>
            <div className="pt-8" style={{ maxWidth: '420px', margin: '0 auto' }}>
              <Card>
                <Space size={8} direction="vertical">
	              <Link href="/" as="/">
	                <img
	                  className="w-48"
	                  src={
	                    `${basePath}/images/logo-light.png`
	                  }
	                  alt="Logo"
	                />
	              </Link>
	              <Space>
                      <Link
                        href="https://app.supabase.io/api/login"
                        as="https://app.supabase.io/api/login"
                      >
                        <a>
                          <Button className="py-3" size="medium" iconRight={<IconCopy />}>
                            Copy SVG
                          </Button>
                        </a>
                      </Link>
                      <Link
                        href="https://app.supabase.io/api/login"
                        as="https://app.supabase.io/api/login"
                      >
                        <a>
                          <Button className="py-3" size="medium" iconRight={<IconDownload />}>
                            Download PNG
                          </Button>
                        </a>
                      </Link>
                    </Space>
                </Space>
              </Card>
              
            </div>
          </SwiperSlide>

          <SwiperSlide key={2}>
            <div className="p-8">
              <CodeBlock
                children={`import React, { useState } from 'react'
import { Auth, Typography, Button } from '@supabase/ui'
import { createClient } from '@supabase/supabase-js'

export default function app() {
  const supabase = createClient(
    "https://YOUR-PROJECT-ID.supabase.co",
    "YOUR-PUBLIC-ANON-KEY"
  );

  function Container(props: any) {
    const { user } = Auth.useUser();
    if (user) {
      return (
        <div>
          <Typography.Text>Signed in: {user.email}</Typography.Text>
          <Button block onClick={() => props.supabaseClient.auth.signOut()}>
            Sign out
          </Button>
        </div>
      )
    }
    return props.children;
  };

  return (
    <Auth.UserContextProvider supabaseClient={supabase}>
      <Container supabaseClient={supabase}>
        <Auth supabaseClient={supabase} />
      </Container>
    </Auth.UserContextProvider>
  );
}
`}
                lang="js"
              />
            </div>
          </SwiperSlide>
        </Swiper>
      </div>
    </div>
  )
}

export default AuthComponentExample