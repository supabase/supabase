import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  Badge,
  Button,
  Card,
  Auth,
  Space,
  Tabs,
  Typography,
  IconCode,
  IconSearch,
} from '@supabase/ui'
import CodeBlock from '../CodeBlock/CodeBlock'
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react'
import Link from 'next/link'
import { useRouter } from 'next/router'

const supabase = createClient(
  'https://rsnibhkhsbfnncjmwnkj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNTIxNDE1MywiZXhwIjoxOTMwNzkwMTUzfQ.OQEbAaTfgDdLCCht251P2JRD3QDnui6nsU8N-tZA_Mc'
)

type Props = {
  darkMode: boolean
}

function AuthComponentExample(props: Props) {
  const { darkMode } = props
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
                <Space size={4} direction="vertical">
                  <div>
                    <Space size={3} direction="vertical">
                      <img
                        src={
                          darkMode
                            ? `${basePath}/brand-assets/supabase-logo-wordmark--light.svg`
                            : `${basePath}/brand-assets/supabase-logo-wordmark--dark.svg`
                        }
                        width="96"
                        alt="Logo"
                      />
                      <Typography.Title level={3}>{'Acme Company'}</Typography.Title>
                    </Space>
                    <Badge dot>Demo</Badge>
                  </div>
                  <Typography.Text>Sign in with</Typography.Text>
                  <div className="flex justify-evenly">
                    <Link href="https://supabase.com/docs/guides/auth/auth-facebook">
                      <Button type="default" size="large">
                        <svg
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 448 512"
                          width="24"
                          height="24"
                        >
                          <path
                            fill="currentColor"
                            d="M400 32H48A48 48 0 0 0 0 80v352a48 48 0 0 0 48 48h137.25V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.27c-30.81 0-40.42 19.12-40.42 38.73V256h68.78l-11 71.69h-57.78V480H400a48 48 0 0 0 48-48V80a48 48 0 0 0-48-48z"
                          ></path>
                        </svg>
                      </Button>
                    </Link>

                    <Link href="https://supabase.com/docs/guides/auth/auth-google">
                      <Button type="default" size="large">
                        <svg
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 488 512"
                          width="22"
                          height="22"
                        >
                          <path
                            fill="currentColor"
                            d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                          ></path>
                        </svg>
                      </Button>
                    </Link>

                    <Link href="https://supabase.com/docs/guides/auth/auth-github">
                      <Button type="default" size="large">
                        <svg
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 256 249"
                          width="22"
                          height="22"
                        >
                          <g fill="currentColor">
                            <path d="M127.505 0C57.095 0 0 57.085 0 127.505c0 56.336 36.534 104.13 87.196 120.99 6.372 1.18 8.712-2.766 8.712-6.134 0-3.04-.119-13.085-.173-23.739-35.473 7.713-42.958-15.044-42.958-15.044-5.8-14.738-14.157-18.656-14.157-18.656-11.568-7.914.872-7.752.872-7.752 12.804.9 19.546 13.14 19.546 13.14 11.372 19.493 29.828 13.857 37.104 10.6 1.144-8.242 4.449-13.866 8.095-17.05-28.32-3.225-58.092-14.158-58.092-63.014 0-13.92 4.981-25.295 13.138-34.224-1.324-3.212-5.688-16.18 1.235-33.743 0 0 10.707-3.427 35.073 13.07 10.17-2.826 21.078-4.242 31.914-4.29 10.836.048 21.752 1.464 31.942 4.29 24.337-16.497 35.029-13.07 35.029-13.07 6.94 17.563 2.574 30.531 1.25 33.743 8.175 8.929 13.122 20.303 13.122 34.224 0 48.972-29.828 59.756-58.22 62.912 4.573 3.957 8.648 11.717 8.648 23.612 0 17.06-.148 30.791-.148 34.991 0 3.393 2.295 7.369 8.759 6.117 50.634-16.879 87.122-64.656 87.122-120.973C255.009 57.085 197.922 0 127.505 0" />
                            <path d="M47.755 181.634c-.28.633-1.278.823-2.185.389-.925-.416-1.445-1.28-1.145-1.916.275-.652 1.273-.834 2.196-.396.927.415 1.455 1.287 1.134 1.923M54.027 187.23c-.608.564-1.797.302-2.604-.589-.834-.889-.99-2.077-.373-2.65.627-.563 1.78-.3 2.616.59.834.899.996 2.08.36 2.65M58.33 194.39c-.782.543-2.06.034-2.849-1.1-.781-1.133-.781-2.493.017-3.038.792-.545 2.05-.055 2.85 1.07.78 1.153.78 2.513-.019 3.069M65.606 202.683c-.699.77-2.187.564-3.277-.488-1.114-1.028-1.425-2.487-.724-3.258.707-.772 2.204-.555 3.302.488 1.107 1.026 1.445 2.496.7 3.258M75.01 205.483c-.307.998-1.741 1.452-3.185 1.028-1.442-.437-2.386-1.607-2.095-2.616.3-1.005 1.74-1.478 3.195-1.024 1.44.435 2.386 1.596 2.086 2.612M85.714 206.67c.036 1.052-1.189 1.924-2.705 1.943-1.525.033-2.758-.818-2.774-1.852 0-1.062 1.197-1.926 2.721-1.951 1.516-.03 2.758.815 2.758 1.86M96.228 206.267c.182 1.026-.872 2.08-2.377 2.36-1.48.27-2.85-.363-3.039-1.38-.184-1.052.89-2.105 2.367-2.378 1.508-.262 2.857.355 3.049 1.398" />
                          </g>
                        </svg>
                      </Button>
                    </Link>

                    <Link href="https://supabase.com/docs/guides/auth/auth-bitbucket">
                      <Button type="default" size="large">
                        <svg
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 512 512"
                          width="22"
                          height="22"
                        >
                          <path
                            fill="currentColor"
                            d="M22.2 32A16 16 0 0 0 6 47.8a26.35 26.35 0 0 0 .2 2.8l67.9 412.1a21.77 21.77 0 0 0 21.3 18.2h325.7a16 16 0 0 0 16-13.4L505 50.7a16 16 0 0 0-13.2-18.3 24.58 24.58 0 0 0-2.8-.2L22.2 32zm285.9 297.8h-104l-28.1-147h157.3l-25.2 147z"
                          ></path>
                        </svg>
                      </Button>
                    </Link>

                    <Link href="https://supabase.com/docs/guides/auth/auth-gitlab">
                      <Button type="default" size="large">
                        <svg
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 512 512"
                          width="22"
                          height="22"
                        >
                          <path
                            fill="currentColor"
                            d="M105.2 24.9c-3.1-8.9-15.7-8.9-18.9 0L29.8 199.7h132c-.1 0-56.6-174.8-56.6-174.8zM.9 287.7c-2.6 8 .3 16.9 7.1 22l247.9 184-226.2-294zm160.8-88l94.3 294 94.3-294zm349.4 88l-28.8-88-226.3 294 247.9-184c6.9-5.1 9.7-14 7.2-22zM425.7 24.9c-3.1-8.9-15.7-8.9-18.9 0l-56.6 174.8h132z"
                          ></path>
                        </svg>
                      </Button>
                    </Link>
                  </div>
                  <div className="flex flex-row w-full items-center justify-center">
                    <div className="w-full h-[1px] bg-gray-500" />
                    <Typography.Text type="secondary" className="w-full text-center text-gray-500">
                      or continue with
                    </Typography.Text>
                    <div className="w-full h-[1px] bg-gray-500" />
                  </div>
                  <Auth.UserContextProvider supabaseClient={supabase}>
                    <AuthContainer supabaseClient={supabase}>
                      <Auth supabaseClient={supabase} />
                    </AuthContainer>
                  </Auth.UserContextProvider>
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
