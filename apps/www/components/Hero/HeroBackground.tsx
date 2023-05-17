import React from 'react'
import dynamic from 'next/dynamic'
import styles from './hero.module.css'
import { useRouter } from 'next/router'

const HeroGrid = dynamic(() => import('./HeroGrid'))
const HeroGrid2 = dynamic(() => import('./HeroGrid2'))

const HeroBackground = () => {
  const router = useRouter()
  const isV1 = router.asPath === '/'
  const isV2 = router.asPath === '/home-2'
  console.log('router', router, isV1, isV2)

  return (
    <>
      <div
        className={[
          'absolute z-[-4] flex flex-col top-0 left-0 w-screen h-screen overflow-hidden pointer-events-none',
        ].join(' ')}
      >
        <div className="absolute bottom-0 z-[1] w-full h-1/3 bg-gradient-to-t from-scale-100 to-transparent" />
        <div className="absolute top-0 z-[1] w-full h-3/5 bg-gradient-to-b from-scale-100 to-transparent" />
      </div>
      <div
        className={[
          'absolute inset-0 w-full h-[600px] lg:h-[800px] overflow-hidden pointer-events-none',
          styles['hero-container'],
        ].join(' ')}
      >
        <div
          className={['w-full h-full opacity-0 dark:opacity-60', styles['gradient']].join(' ')}
        />
        <div className="absolute bottom-0 z-[-2] w-full h-full bg-gradient-to-t from-scale-100 to-transparent" />
        {isV1 && <HeroGrid />}
        {isV2 && <HeroGrid2 />}
      </div>
    </>
  )
}

export default HeroBackground
