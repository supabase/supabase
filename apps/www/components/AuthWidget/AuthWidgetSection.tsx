import { createClient } from '@supabase/supabase-js'
import { Button } from 'ui'
import { useState } from 'react'
// Import Swiper React components
import { useRouter } from 'next/router'
import Image from 'next/image'

import { ColorSwatchIcon, MenuIcon } from '@heroicons/react/outline'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useTheme } from 'next-themes'
import { ThemeImage } from 'ui-patterns/ThemeImage'

function AuthWidgetSection() {
  const supabase = createClient(
    'https://rsnibhkhsbfnncjmwnkj.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNTIxNDE1MywiZXhwIjoxOTMwNzkwMTUzfQ.OQEbAaTfgDdLCCht251P2JRD3QDnui6nsU8N-tZA_Mc'
  )
  const { resolvedTheme } = useTheme()
  const { basePath } = useRouter()
  const [radius, setRadius] = useState('4px')
  const [brandColor, setBrandColor] = useState({
    brand: 'hsl(var(--brand-default))',
    brandAccent: 'hsl(var(--brand-500))',
    brandAccent2: 'hsl(var(--brand-200))',
  })
  const [layout, setLayout] = useState('horizontal')

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
    <div className="sbui-tabs--alt overflow-hidden">
      <div className="bg-background relative border py-2 pb-16">
        <div className="sm:py-18 gap container relative mx-auto grid grid-cols-12 px-6 py-16 md:gap-16 md:py-24 lg:gap-16 lg:px-16 lg:py-24 xl:px-20">
          <div className="relative z-10 col-span-12 mb-16 md:col-span-7 md:mb-0 lg:col-span-6">
            <div className="relative lg:mx-auto lg:max-w-md">
              <div className="border-overlay bg-surface-100 pointer-events-none relative rounded-xl border px-8 py-12 drop-shadow-sm">
                <div className="mb-6 flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 rounded-full p-2"
                      style={{
                        background: brandColor.brandAccent2,
                        color: brandColor.brand,
                      }}
                    >
                      <ColorSwatchIcon strokeWidth={1.5} />
                    </div>
                    <h1 className="text-foreground text-2xl">Acme Industries</h1>
                  </div>
                  <p className="text-foreground-light text-auth-widget-test">
                    Sign in today for Supa stuff
                  </p>
                </div>
                <Auth.UserContextProvider supabaseClient={supabase}>
                  <AuthContainer supabaseClient={supabase}>
                    <Auth
                      // @ts-ignore
                      socialLayout={layout}
                      theme={resolvedTheme?.includes('dark') ? 'dark' : 'default'}
                      providers={['google', 'facebook', 'twitter']}
                      supabaseClient={supabase}
                      appearance={{
                        theme: ThemeSupa,
                        variables: {
                          default: {
                            colors: {
                              brand: brandColor.brand,
                              brandAccent: brandColor.brandAccent,
                            },
                            radii: {
                              borderRadiusButton: radius,
                              buttonBorderRadius: radius,
                              inputBorderRadius: radius,
                            },
                          },
                        },
                      }}
                    />
                  </AuthContainer>
                </Auth.UserContextProvider>
              </div>
            </div>
          </div>
          <div className="col-span-12 md:col-span-5 lg:col-span-6">
            <div className="prose !max-w-md">
              <h3 className="text-2xl">Auth UI</h3>
              <p className="!mb-0">Pre-built auth widgets to get started in minutes.</p>
              <p className="text-foreground-lighter mt-0">
                Customizable authentication UI component with custom themes and extensible styles to
                match your brand and aesthetic
              </p>
              <div className="mb-4 flex items-center space-x-2">
                <div className="relative m-0 w-8 aspect-square flex items-center">
                  <Image
                    src={`${basePath}/images/product/auth/react-icon.svg`}
                    alt="react icon"
                    layout="fill"
                    className="w-full m-0"
                  />
                </div>
                <small>React only. Other frameworks coming soon.</small>
              </div>
            </div>

            <div className="grid gap-8 py-8 lg:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-foreground text-base">Brand color</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setBrandColor({
                        brand: 'hsl(var(--brand-default))',
                        brandAccent: 'hsl(var(--brand-500))',
                        brandAccent2: 'hsl(var(--brand-200))',
                      })
                    }
                    className={[
                      'bg-surface-100 border-brand h-10 w-10 rounded-full border-2 transition hover:scale-105',
                      brandColor.brand === 'hsl(var(--brand-default))'
                        ? '!bg-brand ring-border-strong !border-foreground ring-2 ring-offset-2 ring-offset-transparent drop-shadow-lg'
                        : '',
                    ].join(' ')}
                  ></button>
                  <button
                    onClick={() =>
                      setBrandColor({
                        brand: 'var(--colors-orange9)',
                        brandAccent: 'var(--colors-orange11)',
                        brandAccent2: 'var(--colors-orange3)',
                      })
                    }
                    className={[
                      'h-10 w-10 rounded-full border-2 border-orange-900 bg-orange-600 transition hover:scale-105',
                      brandColor.brand === 'var(--colors-orange9)'
                        ? 'ring-border-strong !border-foreground !bg-orange-900 ring-2 ring-offset-2 ring-offset-transparent drop-shadow-lg'
                        : '',
                    ].join(' ')}
                  ></button>
                  <button
                    onClick={() =>
                      setBrandColor({
                        brand: 'var(--colors-crimson9)',
                        brandAccent: 'var(--colors-crimson11)',
                        brandAccent2: 'var(--colors-crimson3)',
                      })
                    }
                    className={[
                      'border-crimson-900 bg-crimson-500 h-10 w-10 rounded-full border-2 transition hover:scale-105',
                      brandColor.brand === 'var(--colors-crimson9)'
                        ? 'ring-border-strong !border-foreground !bg-crimson-900 ring-2 ring-offset-2 ring-offset-transparent drop-shadow-lg'
                        : '',
                    ].join(' ')}
                  ></button>
                  <button
                    onClick={() =>
                      setBrandColor({
                        brand: 'var(--colors-indigo9)',
                        brandAccent: 'var(--colors-indigo11)',
                        brandAccent2: 'var(--colors-indigo3)',
                      })
                    }
                    className={[
                      'h-10 w-10 rounded-full border-2 border-indigo-900 bg-indigo-600 transition hover:scale-105',
                      brandColor.brand === 'var(--colors-indigo9)'
                        ? 'ring-border-strong !border-foreground !bg-indigo-900 ring-2 ring-offset-2 ring-offset-transparent drop-shadow-lg'
                        : '',
                    ].join(' ')}
                  ></button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-foreground text-base">Rounded corners</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setRadius('4px')}
                    className={[
                      'bg-surface-100 ring-border-strong border-default flex h-10 w-10 items-center justify-center rounded-full border hover:scale-105',
                      radius === '4px'
                        ? 'ring-border-strong !border-foreground border-2 ring-2 ring-offset-2 ring-offset-transparent'
                        : '',
                    ].join(' ')}
                  >
                    <div className="relative m-0 w-4 items-center justify-center text-red-900">
                      <ThemeImage
                        src={{
                          light: '/images/auth-ui/small--dark.svg',
                          dark: '/images/auth-ui/small--light.svg',
                        }}
                        alt="react icon"
                        layout="fill"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </button>
                  <button
                    onClick={() => setRadius('10px')}
                    className={[
                      'bg-surface-100 border-default flex h-10 w-10 items-center justify-center rounded-full  border transition hover:scale-105',
                      radius === '10px'
                        ? 'ring-border-strong !border-foreground border-2 ring-2 ring-offset-2 ring-offset-transparent'
                        : '',
                    ].join(' ')}
                  >
                    <div className="relative m-0 w-4 items-center justify-center text-red-900">
                      <ThemeImage
                        src={{
                          light: '/images/auth-ui/medium--dark.svg',
                          dark: '/images/auth-ui/medium--light.svg',
                        }}
                        alt="react icon"
                        layout="fill"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </button>
                  <button
                    onClick={() => setRadius('32px')}
                    className={[
                      'bg-surface-100 border-default flex h-10 w-10 items-center justify-center rounded-full  border transition hover:scale-105',
                      radius === '32px'
                        ? 'ring-border-strong !border-foreground border-2 ring-2 ring-offset-2 ring-offset-transparent'
                        : '',
                    ].join(' ')}
                  >
                    <div className="relative m-0 w-4 items-center justify-center flex text-red-900">
                      <ThemeImage
                        src={{
                          light: '/images/auth-ui/large--light.svg',
                          dark: '/images/auth-ui/large--dark.svg',
                        }}
                        alt="react icon"
                        layout="fill"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-foreground text-base">Social Auth Layout</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setLayout('horizontal')}
                    className={[
                      'bg-surface-100 border-control flex h-10 w-10 items-center justify-center rounded-full border transition hover:scale-105',
                      layout === 'horizontal'
                        ? 'ring-border-strong !border-foreground border-2 ring-2 ring-offset-2 ring-offset-transparent'
                        : '',
                    ].join(' ')}
                  >
                    <MenuIcon className="text-foreground w-6 rotate-90" />
                  </button>{' '}
                  <button
                    onClick={() => setLayout('vertical')}
                    className={[
                      'bg-surface-100 border-control flex h-10 w-10 items-center justify-center rounded-full border transition hover:scale-105',
                      layout === 'vertical'
                        ? 'ring-border-strong !border-foreground border-2 ring-2 ring-offset-2 ring-offset-transparent'
                        : '',
                    ].join(' ')}
                  >
                    <MenuIcon className="text-foreground w-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthWidgetSection
