import { PassThrough } from 'node:stream'
import { Readable } from 'stream'

/**
 * Keep track of a stream's speed
 * @param stream
 * @param frequency
 */
export function monitorStreamSpeed(stream: Readable, frequency = 1000) {
  let lastIntervalBytes = 0

  const passThrough = new PassThrough()

  const emitSpeed = () => {
    const currentSpeedBytesPerSecond = lastIntervalBytes / (frequency / 1000)
    passThrough.emit('speed', currentSpeedBytesPerSecond)
    lastIntervalBytes = 0 // Reset for the next interval
  }

  const interval = setInterval(() => {
    emitSpeed()
  }, frequency)

  passThrough.on('data', (chunk) => {
    lastIntervalBytes += chunk.length // Increment bytes for the current interval
  })

  const cleanup = () => {
    emitSpeed()
    clearInterval(interval)
    passThrough.removeAllListeners('speed')
  }

  // Handle close event to ensure cleanup
  passThrough.on('close', cleanup)

  // Propagate errors from the source stream to the passThrough
  stream.on('error', (err) => {
    passThrough.destroy(err)
  })

  // Ensure the passThrough ends when the source stream ends
  stream.on('end', () => {
    passThrough.end()
  })

  return stream.pipe(passThrough)
}
