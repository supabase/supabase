'use client'

import { useEffect, useRef } from 'react'

// ─── SVG paths (elephant) ────────────────────────────────────────────────────

const PATHS = [
  'M192.144 125.816h-53.465c-8.506 0-16.159 5.17-19.334 13.061L99.0045 189.43c-3.0613 7.608-1.3448 16.306 4.3775 22.181l10.232 10.506c4.792 4.919 7.474 11.516 7.474 18.384l-.001 14.473c0 20.197 16.373 36.569 36.569 36.569 6.16 0 11.154-4.993 11.154-11.153l.001-86.241c0-18.629 7.441-36.486 20.668-49.602 2.746-2.723 7.178-2.704 9.9.041 2.722 2.745 2.703 7.178-.042 9.9-10.577 10.488-16.526 24.766-16.526 39.661l-.001 86.241c0 13.892-11.262 25.153-25.154 25.153-27.928 0-50.569-22.64-50.569-50.569l.001-14.474c0-3.218-1.257-6.309-3.503-8.615L93.353 221.38c-9.5904-9.847-12.4673-24.424-7.3366-37.176l20.3406-50.553c5.308-13.192 18.101-21.835 32.322-21.835h55.729v.084h10.339c49.104 0 88.91 39.806 88.91 88.91v50.842c0 3.866-3.134 7-7 7s-7-3.134-7-7V200.81c0-41.372-33.538-74.91-74.91-74.91H193.23c-.37 0-.732-.029-1.086-.084Z',
  'M210.03 283.94c0-3.866-3.134-7-7-7s-7 3.134-7 7v3.113c0 26.959 21.854 48.814 48.813 48.814 26.351 0 47.825-20.879 48.781-46.996h24.614c3.866 0 7-3.134 7-7s-3.134-7-7-7h-26.841c-30.744 0-60.256-12.083-82.173-33.643-2.756-2.711-7.188-2.675-9.899.081-2.711 2.756-2.675 7.188.081 9.9 21.725 21.371 50.116 34.423 80.228 37.134-.679 18.629-15.995 33.524-34.791 33.524-19.227 0-34.813-15.587-34.813-34.814v-3.113Z',
  'M238.03 202.145c0 4.792 3.885 8.677 8.677 8.677s8.676-3.885 8.676-8.677-3.884-8.676-8.676-8.676-8.677 3.884-8.677 8.676Z',
]

// ─── Shaders ─────────────────────────────────────────────────────────────────

const vert = /* glsl */ `
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`

// Animated dithered noise over the filled silhouette.
const frag = /* glsl */ `
  precision highp float;

  uniform sampler2D tMap;
  uniform float uHover;
  uniform float uTime;
  uniform vec2 uResolution;

  varying vec2 vUv;

  #define GREEN vec3(0.243, 0.812, 0.557)

  // ── Noise ──
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  // ── Bayer dithering (recursive 8×8) ──
  float bayer2(vec2 a) {
    a = floor(a);
    return fract(a.x / 2.0 + a.y * a.y * 0.75);
  }
  float bayer4(vec2 a)  { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
  float bayer8(vec2 a)  { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

  void main() {
    float shape = texture2D(tMap, vUv).r;

    if (shape < 0.5) { gl_FragColor = vec4(0.0); return; }

    // Animated FBM noise — continuous drift
    vec2 noiseUv = vUv * 3.0 + vec2(uTime * 0.8, uTime * 0.5);
    float n = fbm(noiseUv);

    float value = n * 0.7 + 0.3;

    // Bayer dithering — divide resolution for bigger dots
    vec2  screenPos = vUv * uResolution / 3.0;
    float dither    = bayer8(screenPos);
    float dithered  = smoothstep(dither - 0.04, dither + 0.04, value);

    vec3  col   = GREEN * dithered;
    float alpha = dithered * uHover;

    gl_FragColor = vec4(col * alpha, alpha);
  }
`

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildSVGCanvas(size: number): Promise<HTMLCanvasElement> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    const svgSrc = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 430" width="${size}" height="${size}">
      ${PATHS.map((d) => `<path d="${d}" fill="white"/>`).join('')}
    </svg>`
    const blob = new Blob([svgSrc], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      resolve(canvas)
    }
    img.src = url
  })
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  hovered: boolean
}

export function PostgresGlow({ hovered }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const liveRef = useRef({ hovered: false, hover: 0 })

  useEffect(() => { liveRef.current.hovered = hovered }, [hovered])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let running = true
    let raf: number

    async function init() {
      const { Renderer, Program, Mesh, Triangle, Texture } = await import('ogl')
      if (!running) return

      const svgCanvas = await buildSVGCanvas(512)
      if (!running) return

      const renderer = new Renderer({ canvas, alpha: true, premultipliedAlpha: true, dpr: window.devicePixelRatio })
      const gl = renderer.gl
      gl.clearColor(0, 0, 0, 0)

      const texture = new Texture(gl, {
        image: svgCanvas,
        generateMipmaps: false,
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,
      })

      const geometry = new Triangle(gl)
      const program = new Program(gl, {
        vertex: vert,
        fragment: frag,
        uniforms: {
          tMap:        { value: texture },
          uHover:      { value: 0 },
          uTime:       { value: 0 },
          uResolution: { value: [canvas.width, canvas.height] },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
      })

      const mesh = new Mesh(gl, { geometry, program })

      const container = canvas.parentElement!
      function resize(entries?: ResizeObserverEntry[]) {
        const w = entries?.[0]?.contentRect.width ?? container.offsetWidth
        const h = entries?.[0]?.contentRect.height ?? container.offsetHeight
        renderer.setSize(w, h)
        program.uniforms.uResolution.value = [canvas.width, canvas.height]
      }
      resize()
      const ro = new ResizeObserver(resize)
      ro.observe(container)

      function loop() {
        if (!running) return
        raf = requestAnimationFrame(loop)

        const live = liveRef.current
        const target = live.hovered ? 1 : 0
        live.hover += (target - live.hover) * 0.06

        program.uniforms.uHover.value = live.hover
        program.uniforms.uTime.value = performance.now() / 1000

        renderer.render({ scene: mesh })
      }
      loop()

      return () => ro.disconnect()
    }

    let cleanupResize: (() => void) | undefined
    init().then((c) => { cleanupResize = c })

    return () => {
      running = false
      cancelAnimationFrame(raf)
      cleanupResize?.()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={320}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  )
}
