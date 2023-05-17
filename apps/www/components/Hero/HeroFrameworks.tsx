import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import ReactTooltip from 'react-tooltip'

const frameworks = [
  {
    name: 'Next.js',
    icon: '/images/logos/frameworks/nextjs.svg',
    docs: '/docs/guides/getting-started/quickstarts/nextjs',
  },
  {
    name: 'React',
    icon: '/images/logos/frameworks/react.svg',
    docs: '/docs/guides/getting-started/quickstarts/reactjs',
  },
  {
    name: 'Nuxt',
    icon: '/images/logos/frameworks/nuxtjs.svg',
    docs: '/docs/guides/getting-started/quickstarts/nuxtjs',
  },
  {
    name: 'Flutter',
    icon: '/images/logos/frameworks/flutter.svg',
    docs: '/docs/guides/getting-started/quickstarts/flutter',
  },
  {
    name: 'Svelte',
    icon: '/images/logos/frameworks/svelte.svg',
    docs: '/docs/guides/getting-started/quickstarts/sveltekit',
  },
  {
    name: 'Python',
    icon: '/images/logos/languages/python-icon.svg',
    docs: '/docs/reference/python/introduction',
  },
  // {
  //   name: 'Expo',
  //   icon: '/images/logos/frameworks/expo.svg',
  //   docs: '/docs/guides/getting-started/tutorials/with-expo',
  // },
  {
    name: 'Vue',
    icon: '/images/logos/frameworks/vue.svg',
    docs: '/docs/guides/getting-started/quickstarts/vue',
  },
]

const HeroFrameworks = ({ className }: { className?: string }) => {
  return (
    <div className={['flex text-center flex-col items-center', className].join(' ')}>
      <small className="small !text-scale-1100">Works seamlessly with 20+ frameworks</small>
      <div className="w-full sm:max-w-lg mt-4 md:mt-3 lg:ml-0">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:flex-nowrap">
          {frameworks.map((framework) => (
            <Link href={framework.docs} key={framework.name}>
              <a key={framework.name} className="m-0" data-tip={framework.name}>
                <Image
                  key={framework.name}
                  className="opacity-100 hover:opacity-80 transition-opacity"
                  src={framework.icon}
                  alt={framework.name}
                  width={40}
                  height={40}
                />
              </a>
            </Link>
          ))}
          <ReactTooltip
            effect={'solid'}
            place="bottom"
            backgroundColor="#2e2e2e"
            textColor="white"
            className="!py-2 !px-4"
          />
        </div>
      </div>
    </div>
  )
}

export default HeroFrameworks
