import { useRef, useEffect } from 'react'
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

/**
 * Helper to simplifies controlling requestAnimationFrame
 * @param callback Animation callback function
 * @returns Object with start and stop functions
 */
export const createThreeAnimation = (callback: (time?: number) => void) => {
  const requestRef = { current: undefined } as { current: number | undefined }
  const previousTimeRef = { current: undefined } as { current: number | undefined }

  const animate = (time: number) => {
    if (previousTimeRef.current !== undefined) {
      callback(time)
    }
    previousTimeRef.current = time
    requestRef.current = requestAnimationFrame(animate)
  }

  const start = () => {
    requestRef.current = requestAnimationFrame(animate)
  }

  const stop = () => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current)
    }
  }

  return { start, stop }
}

/**
 * Helper function to load a GLTF model
 * @param url URL of the GLTF model to load
 * @returns Promise that resolves with the loaded model
 */
export const loadGLTFModel = (url: string) => {
  return new Promise<GLTF>((resolve, reject) => {
    const loader = new GLTFLoader()
    loader.load(
      url,
      (gltf) => {
        resolve(gltf)
      },
      undefined,
      (error) => reject(error)
    )
  })
}

/**
 * Custom hook for Three.js setup and animation
 * @param setupCallback Callback function for setting up the scene
 * @returns Object with containerRef
 */
export const useThreeJS = (
  setupCallback: (container: HTMLElement) => {
    cleanup: () => void
    animate: (time?: number) => void
  }
) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const renderer = setupCallback(container)

    // Set up animation loop
    const { start, stop } = createThreeAnimation(renderer.animate.bind(renderer))
    start()

    // Cleanup on unmount
    return () => {
      stop()
      renderer.cleanup()
    }
  }, [setupCallback])

  return { containerRef }
}

export function colorObjToRgb(color: { rgb: number; alpha: number }) {
  return `rgb(${(color.rgb >> 16) & 255} ${(color.rgb >> 8) & 255} ${(color.rgb >> 0) & 255} /  ${color.alpha})`
}
