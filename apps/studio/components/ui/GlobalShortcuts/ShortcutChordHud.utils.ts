const DEFAULT_SEQUENCE_TIMEOUT = 1000

export interface ShortcutSequenceRegistration {
  id: string
  sequence: string[]
  options: {
    enabled?: boolean
    timeout?: number
  }
  triggerCount: number
  matchedStepCount: number
  partialMatchLastKeyTime: number
}

export interface VisibleShortcutChord {
  steps: string[]
  timeoutMs: number
  remainingMs: number
  matchedStepCount: number
  partialMatchLastKeyTime: number
}

interface ShortcutChordCandidate {
  id: string
  steps: string[]
  timeoutMs: number
  matchedStepCount: number
  partialMatchLastKeyTime: number
  sequenceLength: number
}

const getTimeoutMs = (registration: ShortcutSequenceRegistration) =>
  registration.options.timeout ?? DEFAULT_SEQUENCE_TIMEOUT

const compareCandidates = (a: ShortcutChordCandidate, b: ShortcutChordCandidate) => {
  if (a.partialMatchLastKeyTime !== b.partialMatchLastKeyTime) {
    return b.partialMatchLastKeyTime - a.partialMatchLastKeyTime
  }

  if (a.matchedStepCount !== b.matchedStepCount) {
    return b.matchedStepCount - a.matchedStepCount
  }

  if (a.sequenceLength !== b.sequenceLength) {
    return b.sequenceLength - a.sequenceLength
  }

  return a.id.localeCompare(b.id)
}

export function getVisibleShortcutChord(
  sequences: ShortcutSequenceRegistration[],
  now: number
): VisibleShortcutChord | null {
  const dedupedCandidates = new Map<string, ShortcutChordCandidate>()

  for (const registration of sequences) {
    if (registration.sequence.length <= 1) continue
    if (registration.options.enabled === false) continue
    if (registration.matchedStepCount <= 0) continue

    const timeoutMs = getTimeoutMs(registration)
    const elapsedMs = now - registration.partialMatchLastKeyTime

    if (elapsedMs >= timeoutMs) continue

    const steps = registration.sequence.slice(0, registration.matchedStepCount)
    const prefixKey = steps.join('\u0000')

    const candidate: ShortcutChordCandidate = {
      id: registration.id,
      steps,
      timeoutMs,
      matchedStepCount: registration.matchedStepCount,
      partialMatchLastKeyTime: registration.partialMatchLastKeyTime,
      sequenceLength: registration.sequence.length,
    }

    const existing = dedupedCandidates.get(prefixKey)
    if (!existing || compareCandidates(candidate, existing) < 0) {
      dedupedCandidates.set(prefixKey, candidate)
    }
  }

  const visibleCandidate = Array.from(dedupedCandidates.values()).sort(compareCandidates)[0]
  if (!visibleCandidate) return null

  const remainingMs = Math.max(
    0,
    visibleCandidate.timeoutMs - (now - visibleCandidate.partialMatchLastKeyTime)
  )

  if (remainingMs === 0) return null

  return {
    steps: visibleCandidate.steps,
    timeoutMs: visibleCandidate.timeoutMs,
    remainingMs,
    matchedStepCount: visibleCandidate.matchedStepCount,
    partialMatchLastKeyTime: visibleCandidate.partialMatchLastKeyTime,
  }
}

export function isInputLikeElement(element: EventTarget | null): boolean {
  if (!element) {
    return false
  }

  if (element instanceof HTMLInputElement) {
    const type = element.type.toLowerCase()
    if (type === 'button' || type === 'submit' || type === 'reset') {
      return false
    }
    return true
  }

  if (element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
    return true
  }

  return element instanceof HTMLElement && element.isContentEditable
}
