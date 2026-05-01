import { useHotkeyRegistrations } from '@tanstack/react-hotkeys'
import { useEffect, useMemo, useRef, useState } from 'react'
import { cn, KeyboardShortcut } from 'ui'

import { getVisibleShortcutChord, isInputLikeElement } from './ShortcutChordHud.utils'
import { useInterval } from '@/hooks/misc/useInterval'
import { hotkeyToKeys } from '@/state/shortcuts/formatShortcut'

const HUD_TICK_INTERVAL_MS = 50
const COMPLETED_CHORD_FLASH_MS = 400
const HUD_EXIT_ANIMATION_MS = 180
const TILE_FADE_START_AT_PROGRESS = 0.4

interface CompletedShortcutChord {
  steps: string[]
  expiresAt: number
}

interface RenderedShortcutChord {
  steps: string[]
  progress: number
  key: string
}

export function ShortcutChordHud() {
  const { sequences } = useHotkeyRegistrations()
  const [, setTick] = useState(0)
  const [focusVersion, setFocusVersion] = useState(0)
  const [completedChord, setCompletedChord] = useState<CompletedShortcutChord | null>(null)
  const [animationState, setAnimationState] = useState<'entering' | 'shown' | 'exiting'>('shown')
  const [exitingHud, setExitingHud] = useState<RenderedShortcutChord | null>(null)
  const previousSequencesRef = useRef(sequences)
  const exitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const enterAnimationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasVisibleHudRef = useRef(false)
  const latestVisibleHudRef = useRef<RenderedShortcutChord | null>(null)

  useEffect(() => {
    const updateFocus = () => setFocusVersion((value) => value + 1)

    document.addEventListener('focusin', updateFocus, true)
    document.addEventListener('focusout', updateFocus, true)

    return () => {
      document.removeEventListener('focusin', updateFocus, true)
      document.removeEventListener('focusout', updateFocus, true)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current)
      }

      if (enterAnimationTimeoutRef.current) {
        clearTimeout(enterAnimationTimeoutRef.current)
      }
    }
  }, [])

  const now = Date.now()
  const chord = useMemo(() => getVisibleShortcutChord(sequences, now), [sequences, now])
  const completedChordRemainingMs = completedChord ? Math.max(0, completedChord.expiresAt - now) : 0

  useEffect(() => {
    const previousSequencesById = new Map(
      previousSequencesRef.current.map((sequence) => [sequence.id, sequence])
    )

    let newlyCompletedChord: CompletedShortcutChord | null = null

    for (const sequence of sequences) {
      if (sequence.sequence.length <= 1) continue

      const previousSequence = previousSequencesById.get(sequence.id)
      if (!previousSequence) continue
      if (sequence.triggerCount <= previousSequence.triggerCount) continue
      if (previousSequence.matchedStepCount <= 0) continue

      newlyCompletedChord = {
        steps: sequence.sequence,
        expiresAt: Date.now() + COMPLETED_CHORD_FLASH_MS,
      }
    }

    previousSequencesRef.current = sequences

    if (newlyCompletedChord) {
      setCompletedChord(newlyCompletedChord)
    }
  }, [sequences])

  useInterval(
    () => setTick((value) => value + 1),
    chord || completedChordRemainingMs > 0 ? HUD_TICK_INTERVAL_MS : false
  )

  const isSuppressedByInputFocus = useMemo(() => {
    if (typeof document === 'undefined') return false

    return isInputLikeElement(document.activeElement)
  }, [focusVersion])

  const visibleSteps =
    chord?.steps ?? (completedChordRemainingMs > 0 ? completedChord?.steps : undefined)
  const progress =
    chord !== null
      ? chord.remainingMs / chord.timeoutMs
      : completedChordRemainingMs > 0
        ? completedChordRemainingMs / COMPLETED_CHORD_FLASH_MS
        : 0
  const targetHud =
    !isSuppressedByInputFocus && visibleSteps
      ? {
          steps: visibleSteps,
          progress,
          key: visibleSteps.join('\u0000'),
        }
      : null

  useEffect(() => {
    if (targetHud) {
      latestVisibleHudRef.current = targetHud

      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current)
        exitTimeoutRef.current = null
      }

      if (exitingHud) {
        setExitingHud(null)
      }

      if (!hasVisibleHudRef.current) {
        hasVisibleHudRef.current = true
        setAnimationState('entering')

        if (enterAnimationTimeoutRef.current) {
          clearTimeout(enterAnimationTimeoutRef.current)
        }

        enterAnimationTimeoutRef.current = setTimeout(() => {
          setAnimationState('shown')
          enterAnimationTimeoutRef.current = null
        }, 10)
      } else if (animationState === 'exiting') {
        setAnimationState('shown')
      }

      return
    }

    if (!hasVisibleHudRef.current) {
      return
    }

    hasVisibleHudRef.current = false
    setExitingHud(latestVisibleHudRef.current)
    setAnimationState('exiting')

    exitTimeoutRef.current = setTimeout(() => {
      setExitingHud(null)
      exitTimeoutRef.current = null
    }, HUD_EXIT_ANIMATION_MS)
  }, [animationState, exitingHud, targetHud])

  const displayedHud = targetHud ?? exitingHud

  if (!displayedHud) {
    return null
  }

  const tileOpacity =
    displayedHud.progress > TILE_FADE_START_AT_PROGRESS
      ? 1
      : Math.max(displayedHud.progress / TILE_FADE_START_AT_PROGRESS, 0)

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 sm:bottom-6"
      data-testid="shortcut-chord-hud"
    >
      <div
        className={cn(
          'rounded-[12px] bg-background/40 px-1.5 py-1.5 backdrop-blur-sm transition-all duration-180 ease-out dark:bg-foreground/10',
          animationState === 'entering' && 'translate-y-2 scale-95 opacity-0',
          animationState === 'shown' && 'translate-y-0 scale-100 opacity-100',
          animationState === 'exiting' && 'translate-y-1 scale-95 opacity-0'
        )}
      >
        <div className="flex items-center justify-center gap-1.5">
          {displayedHud.steps.map((step, index) => (
            <span
              key={`${step}-${index}`}
              className="transition-opacity duration-100 ease-linear"
              data-testid={`shortcut-chord-hud-key-${index}`}
              style={{ opacity: tileOpacity }}
            >
              <KeyboardShortcut
                className="min-w-8 justify-center rounded-lg !border-black/10 !bg-black/88 !px-2.5 !py-2 !text-[12px] !text-white shadow-lg dark:!border-white/15 dark:!bg-white/92 dark:!text-black"
                keys={hotkeyToKeys(step)}
              />
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
