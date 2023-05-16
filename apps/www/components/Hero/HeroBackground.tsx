import React from 'react'
import dynamic from 'next/dynamic'
import styles from './hero.module.css'

const HeroGrid = dynamic(() => import('./HeroGrid'))

const HeroBackground = ({ showGrid }: any) => (
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
      <div className={['w-full h-full opacity-30 dark:opacity-60', styles['gradient']].join(' ')} />
      <div className="absolute bottom-0 z-[-2] w-full h-full bg-gradient-to-t from-scale-100 to-transparent" />
      {showGrid && <HeroGrid />}
    </div>
  </>
)

export default HeroBackground
