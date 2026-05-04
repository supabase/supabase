import { useHotkeyRegistrations } from '@tanstack/react-hotkeys'
import { useEffect, useMemo, useRef, useState } from 'react'
import { cn, KeyboardShortcut } from 'ui'

import { getVisibleShortcutChord, isInputLikeElement } from './ShortcutChordHud.utils'
import { hotkeyToKeys } from '@/state/shortcuts/formatShortcut'

const COMPLETED_CHORD_FLASH_MS = 400
const TILE_FADE_START_AT_PROGRESS = 0.4

interface CompletedShortcutChord {
  steps: string[]
  expiresAt: number
}

export function ShortcutChordHud() {
  const { sequences } = useHotkeyRegistrations()
  const [, refresh] = useState(0)
  const [focusVersion, setFocusVersion] = useState(0)
  const [completedChord, setCompletedChord] = useState<CompletedShortcutChord | null>(null)
  const previousSequencesRef = useRef(sequences)
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
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
  const timeoutMs = chord?.timeoutMs ?? COMPLETED_CHORD_FLASH_MS
  const remainingMs = chord?.remainingMs ?? completedChordRemainingMs

  useEffect(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
      refreshTimeoutRef.current = null
    }

    if (remainingMs <= 0) {
      return
    }

    const fadeStartDelayMs = Math.max(0, remainingMs - timeoutMs * TILE_FADE_START_AT_PROGRESS)
    const nextRefreshDelayMs =
      progress > TILE_FADE_START_AT_PROGRESS ? fadeStartDelayMs : remainingMs

    refreshTimeoutRef.current = setTimeout(
      () => {
        refresh((value) => value + 1)
        refreshTimeoutRef.current = null
      },
      Math.max(0, nextRefreshDelayMs)
    )
  }, [progress, remainingMs, timeoutMs])

  if (!visibleSteps || isSuppressedByInputFocus) {
    return null
  }

  const tileOpacity = progress > TILE_FADE_START_AT_PROGRESS ? 1 : 0
  const tileFadeDurationMs = timeoutMs * TILE_FADE_START_AT_PROGRESS

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 sm:bottom-6"
      data-testid="shortcut-chord-hud"
    >
      <div
        className={cn(
          'animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-1 rounded-[12px] bg-background/40 px-1.5 py-1.5 backdrop-blur-sm duration-150 dark:bg-foreground/10'
        )}
      >
        <div className="flex items-center justify-center gap-1.5">
          {visibleSteps.map((step, index) => (
            <span
              key={`${step}-${index}`}
              className="transition-opacity ease-linear"
              data-testid={`shortcut-chord-hud-key-${index}`}
              style={{
                opacity: tileOpacity,
                transitionDuration: `${tileFadeDurationMs}ms`,
              }}
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
