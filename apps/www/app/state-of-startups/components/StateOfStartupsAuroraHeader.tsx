'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import UnicornScene from 'unicornstudio-react/next'

export function StateOfStartupsAuroraHeader() {
  const { resolvedTheme } = useTheme()
  const [shaderLoaded, setShaderLoaded] = useState(false)

  const jsonFilePath =
    resolvedTheme === 'light'
      ? '/images/state-of-startups/aurora-dithered-shader-light.json'
      : '/images/state-of-startups/aurora-dithered-shader-dark.json'

  // Cover with placeholder whenever the theme (and thus the shader) changes
  useEffect(() => {
    setShaderLoaded(false)
  }, [resolvedTheme])

  return (
    <header
      className="relative w-full overflow-hidden"
      style={{ minHeight: '72vh', background: 'hsl(var(--background-alternative-default))' }}
    >
      {/* Aurora shader scene — swaps file on theme change */}
      <div aria-hidden="true" className="absolute inset-0">
        <UnicornScene
          key={jsonFilePath}
          jsonFilePath={jsonFilePath}
          width="100%"
          height="100%"
          className="w-full h-full"
          dpi={1.5}
          fps={24}
          onLoad={() => setShaderLoaded(true)}
        />
      </div>

      {/* Placeholder — visible until shader loads, fades out on load */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none transition-opacity [transition-duration:1200ms]"
        style={{
          opacity: shaderLoaded ? 0 : 1,
          background: 'hsl(var(--background-alternative-default))',
        }}
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, hsl(var(--background-alternative-default)) 1%, hsl(var(--background-alternative-default) / 0.9) 25%, transparent 90%)',
        }}
      />

      {/* Content — constrained to default container */}
      <div
        className="relative z-10 max-w-[60rem] mx-auto px-8 flex flex-col gap-4 justify-end pb-16 md:pb-24"
        style={{ minHeight: '72vh' }}
      >
        <p className="font-mono uppercase tracking-wide text-sm text-foreground-light">
          Supabase Presents
        </p>
        <h1 className="text-5xl md:text-6xl xl:text-8xl font-light text-foreground leading-[0.92] tracking-tight">
          The State
          <br />
          of Startups <span className="text-brand font-medium">2026</span>
        </h1>
      </div>
    </header>
  )
}
