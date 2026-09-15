'use client'

import { useEffect, useRef } from 'react'

// ─── SVG paths (shield-user) ────────────────────────────────────────────────

const SHIELD_PATH =
  'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z'

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
    const svgSrc = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
      <path d="${SHIELD_PATH}" fill="white"/>
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

export function ShieldGlow({ hovered }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const liveRef = useRef({ hovered: false, hover: 0 })

  useEffect(() => {
    liveRef.current.hovered = hovered
  }, [hovered])

  useEffect(() => {
    const canvasMaybe = canvasRef.current
    if (!canvasMaybe) return
    const canvas: HTMLCanvasElement = canvasMaybe

    let running = true
    let raf: number

    async function init() {
      const { Renderer, Program, Mesh, Triangle, Texture } = await import('ogl')
      if (!running) return

      const svgCanvas = await buildSVGCanvas(512)
      if (!running) return

      const renderer = new Renderer({
        canvas,
        alpha: true,
        premultipliedAlpha: true,
        dpr: window.devicePixelRatio,
      })
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
          tMap: { value: texture },
          uHover: { value: 0 },
          uTime: { value: 0 },
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
    init().then((c) => {
      cleanupResize = c
    })

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
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ mixBlendMode: 'screen' }}
    />
  )
}
