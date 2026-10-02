import { onTestFinished, vi } from 'vitest'

export function spyOnAbortSignalTimeout() {
  const timeoutSignal = new AbortController().signal
  const timeoutSpy = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(timeoutSignal)
  onTestFinished(() => timeoutSpy.mockRestore())

  return { timeoutSignal, timeoutSpy }
}

export function spyOnAbortSignalAny() {
  const anySignal = new AbortController().signal
  const anySpy = vi.spyOn(AbortSignal, 'any').mockReturnValue(anySignal)
  onTestFinished(() => anySpy.mockRestore())

  return { anySignal, anySpy }
}
