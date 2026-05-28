'use client'

import type { RiveParameters } from '@rive-app/react-webgl2'
import {
  useRive,
  useStateMachineInput,
  useViewModel,
  useViewModelInstance,
  useViewModelInstanceColor,
} from '@rive-app/react-webgl2'
import { memo, useEffect, useMemo, useRef, useState, type FC, type ReactNode } from 'react'
import { cn } from 'ui'

export type PersonaState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'asleep'

interface PersonaProps {
  state: PersonaState
  onLoad?: RiveParameters['onLoad']
  onLoadError?: RiveParameters['onLoadError']
  onReady?: () => void
  onPause?: RiveParameters['onPause']
  onPlay?: RiveParameters['onPlay']
  onStop?: RiveParameters['onStop']
  className?: string
  variant?: keyof typeof sources
}

const stateMachine = 'default'

const sources = {
  obsidian: {
    dynamicColor: true,
    hasModel: true,
    source: 'https://ejiidnob33g9ap1r.public.blob.vercel-storage.com/obsidian-2.0.riv',
  },
} as const

function getCurrentTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined') {
    if (document.documentElement.classList.contains('dark')) {
      return 'dark'
    }
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
  }
  return 'light'
}

function getSupabaseBrandRgb(theme: 'light' | 'dark'): [number, number, number] {
  if (theme === 'dark') {
    return [62, 207, 142]
  }

  return [56, 178, 124]
}

function useTheme(enabled: boolean) {
  const [theme, setTheme] = useState<'light' | 'dark'>(getCurrentTheme)

  useEffect(() => {
    if (!enabled) {
      return
    }

    const observer = new MutationObserver(() => {
      setTheme(getCurrentTheme())
    })

    observer.observe(document.documentElement, {
      attributeFilter: ['class'],
      attributes: true,
    })

    let mql: MediaQueryList | null = null
    const handleMediaChange = () => {
      setTheme(getCurrentTheme())
    }

    if (window.matchMedia) {
      mql = window.matchMedia('(prefers-color-scheme: dark)')
      mql.addEventListener('change', handleMediaChange)
    }

    return () => {
      observer.disconnect()
      if (mql) {
        mql.removeEventListener('change', handleMediaChange)
      }
    }
  }, [enabled])

  return theme
}

function useStrictModeSafeInit() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => {
      cancelAnimationFrame(id)
      setReady(false)
    }
  }, [])

  return ready
}

interface PersonaWithModelProps {
  rive: ReturnType<typeof useRive>['rive']
  source: (typeof sources)[keyof typeof sources]
  children: ReactNode
}

const PersonaWithModel = memo(({ rive, source, children }: PersonaWithModelProps) => {
  const theme = useTheme(source.dynamicColor)
  const viewModel = useViewModel(rive, { useDefault: true })
  const viewModelInstance = useViewModelInstance(viewModel, {
    rive,
    useDefault: true,
  })
  const viewModelInstanceColor = useViewModelInstanceColor('color', viewModelInstance)

  useEffect(() => {
    if (!(viewModelInstanceColor && source.dynamicColor)) {
      return
    }

    const [r, g, b] = getSupabaseBrandRgb(theme)
    viewModelInstanceColor.setRgb(r, g, b)
  }, [viewModelInstanceColor, theme, source.dynamicColor])

  return children
})

PersonaWithModel.displayName = 'PersonaWithModel'

const Persona: FC<PersonaProps> = memo(
  ({
    variant = 'obsidian',
    state = 'idle',
    onLoad,
    onLoadError,
    onReady,
    onPause,
    onPlay,
    onStop,
    className,
  }) => {
    const source = sources[variant]
    const callbacksRef = useRef({
      onLoad,
      onLoadError,
      onPause,
      onPlay,
      onReady,
      onStop,
    })

    useEffect(() => {
      callbacksRef.current = {
        onLoad,
        onLoadError,
        onPause,
        onPlay,
        onReady,
        onStop,
      }
    }, [onLoad, onLoadError, onPause, onPlay, onReady, onStop])

    const stableCallbacks = useMemo(
      () => ({
        onLoad: ((loadedRive) =>
          callbacksRef.current.onLoad?.(loadedRive)) as RiveParameters['onLoad'],
        onLoadError: ((err) =>
          callbacksRef.current.onLoadError?.(err)) as RiveParameters['onLoadError'],
        onPause: ((event) =>
          callbacksRef.current.onPause?.(event)) as RiveParameters['onPause'],
        onPlay: ((event) => callbacksRef.current.onPlay?.(event)) as RiveParameters['onPlay'],
        onReady: () => callbacksRef.current.onReady?.(),
        onStop: ((event) => callbacksRef.current.onStop?.(event)) as RiveParameters['onStop'],
      }),
      []
    )

    const ready = useStrictModeSafeInit()

    const { rive, RiveComponent } = useRive(
      ready
        ? {
            autoplay: true,
            onLoad: stableCallbacks.onLoad,
            onLoadError: stableCallbacks.onLoadError,
            onPause: stableCallbacks.onPause,
            onPlay: stableCallbacks.onPlay,
            onRiveReady: stableCallbacks.onReady,
            onStop: stableCallbacks.onStop,
            src: source.source,
            stateMachines: stateMachine,
          }
        : null
    )

    const listeningInput = useStateMachineInput(rive, stateMachine, 'listening')
    const thinkingInput = useStateMachineInput(rive, stateMachine, 'thinking')
    const speakingInput = useStateMachineInput(rive, stateMachine, 'speaking')
    const asleepInput = useStateMachineInput(rive, stateMachine, 'asleep')

    useEffect(() => {
      if (listeningInput) {
        listeningInput.value = state === 'listening'
      }
      if (thinkingInput) {
        thinkingInput.value = state === 'thinking'
      }
      if (speakingInput) {
        speakingInput.value = state === 'speaking'
      }
      if (asleepInput) {
        asleepInput.value = state === 'asleep'
      }
    }, [state, listeningInput, thinkingInput, speakingInput, asleepInput])

    return (
      <PersonaWithModel rive={rive} source={source}>
        <RiveComponent className={cn('size-16 shrink-0', className)} />
      </PersonaWithModel>
    )
  }
)

Persona.displayName = 'Persona'

export { Persona }
