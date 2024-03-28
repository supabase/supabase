import React, { useEffect, useState } from 'react'
import anime from 'animejs'
import { NextSeo } from 'next-seo'
import { debounce } from 'lodash'
import { isBrowser } from 'common'
import { Button, Input, Select } from 'ui'
import supabase from '~/lib/supabaseMisc'
import DefaultLayout from '~/components/Layouts/Default'
import { Dot } from '~/components/LaunchWeek/11/LW11Background/Dot'

const CANVAS_CONFIG = {
  w: 1200,
  h: 630,
}

const defaultConfig = {
  dotArea: 15,
  percentageLarge: 0.995,
  percentageAnimated: 0.75,
  lightModeFacor: 1,
  randomizeLargeDots: 3,
  randomizeSmallDots: 0.7,
  minSpeed: 1,
  maxSpeed: 4,
  minOscillation: 1,
  maxOscillation: 12,
  minDelay: -3000,
  maxDelay: 15000,
  minDuration: 200,
  maxDuration: 10000,
}

const LW11 = () => {
  const OG_VIDEO_DURATION = 0.01
  const STORAGE_BUCKET = 'images'

  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const canvasSnapRef = React.useRef<HTMLImageElement>(null)
  const [size, setSize] = useState({ w: CANVAS_CONFIG.w, h: CANVAS_CONFIG.h })
  const [activeTicketType, setActiveTicketType] = useState<'regular' | 'platinum' | 'secret'>(
    'regular'
  )
  const [ticketNumber, setTicketNumber] = useState<string>('001')
  const STORAGE_PATH = `lw11/assets/backgrounds/${activeTicketType}/${ticketNumber}`
  const [uploadState, setUploadState] = useState('initial')
  const [ogImagePath, setOgImagePath] = useState(
    `${process.env.NEXT_PUBLIC_MISC_USE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${STORAGE_PATH}.png`
  )
  const [ogVideoPath, setOgVideoPath] = useState(
    `${process.env.NEXT_PUBLIC_MISC_USE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${STORAGE_PATH}.mp4`
  )
  const [config] = useState(defaultConfig)

  const TICKET_TYPES = {
    regular: {
      dot: '255,255,255',
      background: '#060809',
    },
    platinum: {
      dot: '6, 8, 9',
      background: '#E8E8E8',
    },
    secret: {
      dot: '255,255,255',
      background: '#060809',
    },
  }

  const DOT_AREA = config.dotArea
  let GRID_COLS = Math.floor(canvasRef.current?.getBoundingClientRect().width! / DOT_AREA)
  let GRID_ROWS = Math.floor(canvasRef.current?.getBoundingClientRect().height! / DOT_AREA)
  const canvas = canvasRef.current
  const ctx = canvas?.getContext('2d')

  let dotsArray: any[] = []
  function init() {
    if (!ctx || !canvas) return
    ctx.globalCompositeOperation = 'destination-over'
    ctx.clearRect(0, 0, CANVAS_CONFIG.w, CANVAS_CONFIG.h)

    // Generate grid
    dotsArray = []

    GRID_COLS = Math.floor(canvasRef.current?.getBoundingClientRect().width! / DOT_AREA)
    GRID_ROWS = Math.floor(canvasRef.current?.getBoundingClientRect().height! / DOT_AREA)

    for (let i = 0; i < GRID_COLS + 2; i++) {
      for (let j = 0; j < GRID_ROWS + 2; j++) {
        const isLarge = Math.random() > config.percentageLarge
        const isGreen = isLarge ? Math.random() > 0.5 : false
        const isAnimated = false
        const direction = isAnimated ? (Math.random() > 0.5 ? 'vertical' : 'horizontal') : undefined
        const speed = isAnimated ? anime.random(config.minSpeed, config.maxSpeed) : undefined
        const opacity = isLarge ? 1 : anime.random(activeTicketType === 'platinum' ? 0.6 : 0.1, 1)
        const isReverse = isAnimated ? Math.random() > 0.5 : undefined
        const oscillation = isAnimated
          ? anime.random(config.minOscillation, config.maxOscillation).toFixed()
          : undefined
        const dotSize = isLarge
          ? Math.random() *
            ((activeTicketType === 'platinum' ? config.lightModeFacor : 1) *
              config.randomizeLargeDots)
          : Math.random() *
            ((activeTicketType === 'platinum' ? config.lightModeFacor : 1) *
              config.randomizeSmallDots)
        const endPos = {
          x: anime
            .random(
              DOT_AREA * 1 - DOT_AREA / 2 + dotSize / 2,
              DOT_AREA * 10 - DOT_AREA / 2 + dotSize / 2
            )
            .toFixed(),
          y: anime
            .random(
              DOT_AREA * 1 - DOT_AREA / 2 + dotSize / 2,
              DOT_AREA * 10 - DOT_AREA / 2 + dotSize / 2
            )
            .toFixed(),
        }
        const delay = anime.random(config.minDelay, config.maxDelay)
        const duration = anime.random(config.minDuration, config.maxDuration)
        const animationConfig: any = isAnimated
          ? {
              direction,
              speed,
              isReverse,
              oscillation,
              endPos,
              delay,
              duration,
            }
          : undefined
        const x =
          (canvasRef.current?.getBoundingClientRect().width! / GRID_COLS) * i +
          DOT_AREA / 2 -
          dotSize / 2
        const y =
          (canvasRef.current?.getBoundingClientRect().height! / GRID_ROWS) * j +
          DOT_AREA / 2 -
          dotSize / 2
        const w = dotSize
        const h = dotSize
        const id = i + '-' + j

        // @ts-ignore
        dotsArray.push(
          new Dot(x, y, w, h, opacity, animationConfig, TICKET_TYPES[activeTicketType].dot)
        )
      }
    }

    draw()
  }

  const drawOgContent = () => {
    if (!ctx) return

    ctx.font = '32px IBM Plex Mono'
  }

  function draw() {
    if (!isBrowser) return

    for (let i = 0; i < dotsArray.length; i++) {
      dotsArray[i].update(ctx)
    }

    drawOgContent()
  }

  function resize() {
    setSize({ w: CANVAS_CONFIG.w, h: CANVAS_CONFIG.h })
    init()
  }

  const uploadImage = async (blob: Blob | string) => {
    const { data: imageData, error: imageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(STORAGE_PATH + '.png', blob!, {
        // cacheControl: '3600',
        contentType: 'image/png',
        upsert: true,
      })

    console.log(imageData, imageError)

    if (imageData) {
      console.log('uploaded image', imageData)
      setOgImagePath(imageData.path)
      setUploadState(`success: ${imageData.path}`)
    }
    imageError && setUploadState(`error: ${imageError.message}`)
  }

  const record = (e: any) => {
    e.preventDefault()
    if (!ctx || !canvas || !canvasSnapRef) return
    console.log('Capture image', ctx)
    setUploadState('recording')
    const chunks: any = []
    const stream = canvas.captureStream() // grab our canvas MediaStream
    const rec = new MediaRecorder(stream) // init the recorder

    rec.ondataavailable = (e) => chunks.push(e.data)
    rec.onstop = () => {
      canvas.toBlob(
        (b) => {
          uploadImage(b!)
        },
        'image/png',
        1
      )
    }

    rec.start()
    setTimeout(() => rec.stop(), OG_VIDEO_DURATION * 1000)
  }

  useEffect(() => {
    if (!isBrowser) return
    const handleDebouncedResize = debounce(() => resize(), 10)
    window.addEventListener('resize', handleDebouncedResize)

    return () => window.removeEventListener('resize', handleDebouncedResize)
  }, [])

  useEffect(() => {
    setTimeout(() => {
      resize()
      init()
    }, 100)
  }, [])

  init()

  return (
    <>
      <NextSeo
        title="Supabase GA week"
        description="Supabase GA week"
        openGraph={{
          title: 'Supabase GA week',
          description: 'Supabase GA week',
          url: 'https://supabase.com/launch-week',
          images: [
            {
              url: ogImagePath,
              width: CANVAS_CONFIG.w,
              height: CANVAS_CONFIG.h,
              alt: 'Supabase GA week',
              type: 'image/png',
            },
          ],
          videos: [
            {
              url: ogVideoPath,
              secureUrl: ogVideoPath,
              width: CANVAS_CONFIG.w,
              height: CANVAS_CONFIG.h,
              alt: 'Supabase GA week',
              type: 'video/mp4',
            },
          ],
        }}
      />
      <DefaultLayout>
        <div className="absolute z-20 left-4 top-4 bg-alternative border rounded-lg p-4 shadow flex flex-col gap-2">
          <form onSubmit={record} className="flex flex-col gap-2">
            <Select
              id="ticket-type"
              name="Change ticket type"
              layout="vertical"
              value={activeTicketType}
              className="w-full"
              onChange={(e: any) => setActiveTicketType(e.target.value)}
            >
              <Select.Option value="regular">regular</Select.Option>
              <Select.Option value="platinum">platinum</Select.Option>
              <Select.Option value="secret">secret</Select.Option>
            </Select>
            <Input value={ticketNumber} onChange={(v) => setTicketNumber(v.target.value)} />
            <Button htmlType="submit">Capture image</Button>
          </form>
          <p>Path: {STORAGE_PATH}</p>
          <p className="text-sm text-foreground-light">
            {uploadState === 'initial'
              ? '-'
              : uploadState === 'recording'
                ? 'recording...'
                : uploadState === 'uploading'
                  ? 'uploading'
                  : uploadState}
          </p>
        </div>
        <div className="relative py-10 gap-4 items-center justify-center w-full h-full overflow-hidden flex flex-col">
          <canvas
            ref={canvasRef}
            id="lw-canvas"
            className="w-[1200px] h-[600px] border"
            width={size.w}
            height={size.h}
            style={{
              background: TICKET_TYPES[activeTicketType].background,
            }}
          />
        </div>
      </DefaultLayout>
    </>
  )
}

export default LW11
