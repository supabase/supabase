'use client'

import { useConfig } from '@/src/hooks/use-config'
import { useEffect } from 'react'
import { cn } from 'ui'

export default function ProjectContentTransition({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [config, setConfig] = useConfig()
  const { isChangingProject, selectedProject } = config

  useEffect(() => {
    // if (selectedProject) {
    //   setConfig({
    //     ...config,
    //     isChangingProject: true,
    //   })
    //   // wait 3 seconds
    //   setTimeout(() => {
    //     setConfig({
    //       ...config,
    //       isChangingProject: false,
    //     })
    //   }, 1000)
    // }
  }, [selectedProject])

  return (
    <>
      <div className="relative grow flex">
        <div
          className={cn(
            'grow',
            'scale-100',
            isChangingProject && 'scale-[99%] mt-2',
            'transition-all',
            'duration-200',
            'ease-in-out'
          )}
        >
          {children}
        </div>
        <div
          className={cn(
            isChangingProject &&
              'absolute top-0 left-0 w-full h-full bg-dash-canvas/50 backdrop-blur-sm z-30 flex items-center justify-center',
            'transition-all',
            'duration-500',
            'ease-in-out'
          )}
        ></div>
      </div>
    </>
  )
}
