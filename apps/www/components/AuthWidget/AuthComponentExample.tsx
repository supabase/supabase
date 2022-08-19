import { createClient } from '@supabase/supabase-js'
import { Button, IconCode, IconSearch, Tabs } from '@supabase/ui'
import { useState } from 'react'
import CodeBlock from '../CodeBlock/CodeBlock'
// Import Swiper React components
import { useRouter } from 'next/router'

import { useTheme } from '../Providers'

import { Auth, ThemeSupa } from '@supabase/auth-ui-react'
import { ColorSwatchIcon } from '@heroicons/react/outline'

const supabase = createClient(
  'https://rsnibhkhsbfnncjmwnkj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNTIxNDE1MywiZXhwIjoxOTMwNzkwMTUzfQ.OQEbAaTfgDdLCCht251P2JRD3QDnui6nsU8N-tZA_Mc'
)

function AuthComponentExample() {
  const { isDarkMode } = useTheme()
  const { basePath } = useRouter()
  const [theme, setTheme] = useState('default')

  // // store API swiper instance
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
          <p>Signed in: {user.email}</p>
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
      <Tabs
        activeId={imageSwiperActiveIndex.toString()}
        onChange={(id: string) => handleNavChange(Number(id))}
      >
        <Tabs.Panel label="Preview" id="0" icon={<IconSearch />}>
          <span></span>
        </Tabs.Panel>
        <Tabs.Panel label="Code" icon={<IconCode />} id="1">
          <span></span>
        </Tabs.Panel>
      </Tabs>

      {/* Controls */}
      <Button type="default" onClick={() => setTheme('dark')}>
        Dark
      </Button>
      <Button type="default" onClick={() => setTheme('default')}>
        Light
      </Button>

      <div className={`auth-container dark:bg-scale-100 relative border bg-white py-2 pb-16`}>
        <div className="dark:bg-scale-300 border-scale-500 m-12 mx-auto max-w-md rounded-xl border bg-white py-8 px-8 drop-shadow-md">
          <div className="mb-6">
            <div className="text-scale-1100 w-8">
              <ColorSwatchIcon strokeWidth={1.5} />
            </div>
            <h1 className="text-auth-widget-input text-2xl">Acne Ltd</h1>
          </div>
          <p className="text-auth-widget-test">Sign in today for Supa stuff</p>
          <Auth.UserContextProvider supabaseClient={supabase}>
            <AuthContainer supabaseClient={supabase}>
              <Auth
                theme={theme}
                providers={['google', 'facebook', 'twitter']}
                supabaseClient={supabase}
                appearance={{ theme: ThemeSupa }}
                socialLayout="horizontal"
              />
            </AuthContainer>
          </Auth.UserContextProvider>
        </div>
      </div>

      {/* <div className={theme === 'dark' ? 'dark' : 'all-unset'}>
        <div
          className={`auth-container dark:bg-scale-100 relative border bg-white py-2 pb-16 dark:border-gray-600`}
        >
          <div className="pt-8" style={{ maxWidth: '420px', margin: '0 auto' }}>
            <div className="dark:bg-scale-400 border-scale-700 rounded-xl border bg-white py-8 px-8 drop-shadow-md">
              <div className="mb-6">
                <div className="text-scale-1100 w-8">
                  <ColorSwatchIcon strokeWidth={1.5} />
                </div>
                <h1 className="text-auth-widget-input text-2xl">Acne Ltd</h1>
              </div>
              <p className="text-auth-widget-test">Sign in today for Supa stuff</p>
              <Auth.UserContextProvider supabaseClient={supabase}>
                <AuthContainer supabaseClient={supabase}>
                  <Auth
                    theme={theme}
                    providers={['google', 'facebook', 'twitter']}
                    supabaseClient={supabase}
                    appearance={{ theme: ThemeSupa }}
                    socialLayout="horizontal"
                  />
                </AuthContainer>
              </Auth.UserContextProvider>
            </div>
          </div>
        </div>
      </div> */}
      <CodeBlock
        children={`import React, { useState } from 'react'
import { Auth, Button } from '@supabase/ui'
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
          <p>Signed in: {user.email}</p>
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
  )
}

export default AuthComponentExample
