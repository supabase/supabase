import { useEffect } from 'react'
import { Button } from 'ui'
import { Application } from '@splinetool/runtime'

const CTABanner = (props: any) => {
  const { darkerBg } = props

  useEffect(() => {
    if (!document) return
    const canvas = document.getElementById('canvas3d')
    if (!canvas) return

    const spline = new Application(canvas as any)
    // spline.load('https://prod.spline.design/EVQrv4Zsx5JT2pDe/scene.splinecode').then(() => {
    spline.load('https://prod.spline.design/0Txq7YaSsBK2XeDK/scene.splinecode').then(() => {
      const obj = spline.findObjectById('ab3a4cd0-90a8-47c7-b2c7-b0ee1e0bb8a6')
      console.log(obj, spline)
      spline.setZoom(2.5)
    })
  }, [])

  return (
    <div
      className={`
        bg-[var(--color-bg-darkest)] relative items-center border-t py-32 text-center overflow-hidden
        ${darkerBg ? 'dark:bg-dark-900' : ''} px-16
      `}
    >
      <div className="relative z-10 flex flex-col items-center gap-4">
        {props.hasLogo && (
          <div className="relative w-screen -mb-[55px] -mt-32 z-0 h-[300px] lg:min-h-[250px] lg:h-[300px]">
            <div className="absolute w-full h-full z-50 pointer-events-none inset-0 bg-gradient-to-t from-[var(--color-bg-darkest)] via-transparent to-transparent" />
            <div className="absolute w-full h-full z-50 inset-0 bg-[var(--color-bg-darkest)] top-[100%]" />
            <canvas
              className="relative z-20 w-[400px] h-[400px] bottom-[-40px] lg:bottom-[-60px]"
              id="canvas3d"
            />
          </div>
        )}
        <div className="relative z-10 col-span-12">
          <h2 className="text-4xl sm:text-4xl">
            <span className="text-scale-900">Build in a weekend</span>
            <span className="text-scale-1200 block dark:text-white"> scale to millions</span>
          </h2>
        </div>
        <div className="col-span-12 mt-4">
          <a href="https://supabase.com/dashboard">
            <Button size="medium" className="text-white">
              Start your project
            </Button>
          </a>
        </div>
      </div>

      <div className="absolute z-0 mx-auto w-full h-auto lg:w-auto lg:h-full left-0 right-0 flex justify-center top-0 text-white opacity-50">
        <img
          src="/images/index/soft-blur-grid-03.png"
          alt="background decoration image with grid"
          className="w-full h-auto lg:w-auto lg:h-full"
        />
      </div>
    </div>
  )
}

export default CTABanner
