'use client'

import React, { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import { cn, InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from 'ui'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { useKey } from 'react-use'
import useConfData from '../hooks/use-conf-data'
import useLwGame, { VALID_KEYS } from '../hooks/useLwGame'

const ThreeTicketCanvas: React.FC<{
  username: string
  className?: string
  ticketType?: 'regular' | 'platinum' | 'secret'
  ticketPosition?: 'left' | 'right'
  sharePage?: boolean
}> = ({
  username = 'Francesco Sansalvadore',
  className,
  ticketType = 'regular',
  ticketPosition = 'right',
  sharePage = false,
}) => {
  const { userData } = useConfData()
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme?.includes('dark')!
  const inputRef = useRef(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const ticketRef = useRef<THREE.Mesh | null>(null)
  const animationFrameRef = useRef<number>()
  const targetRotation = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const targetScale = useRef<number>(0)
  const groupYRotation = useRef<number>(0)
  const isFlipped = useRef(false)
  const dragStartX = useRef<number | null>(null)
  const dragDelta = useRef<number>(0)
  const isDragging = useRef<boolean>(false)
  const currentValue = useRef<string>('')
  const flipDirection = useRef<number>(0)
  const {
    isGameMode,
    setIsGameMode,
    winningPhrase,
    handleIndexCount,
    setGameState,
    value,
    phraseLength,
    REGEXP_ONLY_CHARS,
    hasWon,
  } = useLwGame(inputRef)

  const CANVAS_HEIGHT = 600
  const FLIP_DELTA = 20 // Swipe px threshold for flipping
  const LINE_HEIGHT = 1.6
  const SCALE_VARIATION_ON_INTERACTION = 0.025
  const TICKET_FONT_PADDING_LEFT = -6.4
  const DISPLAY_NAME = username?.split(' ').reverse() || []
  const ALIGN_RIGHT = ticketPosition === 'right'
  const IS_PLATINUM = ticketType === 'platinum'
  const IS_SECRET = ticketType === 'secret'
  const TEXT_Z_POSITION = 0
  const FOOTER_CONTENT = [
    {
      text: 'LAUNCH WEEK 13',
      position: { x: TICKET_FONT_PADDING_LEFT, y: -6.8, z: TEXT_Z_POSITION },
      size: 0.63,
    },
    {
      text: '2-6 DEC / 7AM PT',
      position: { x: TICKET_FONT_PADDING_LEFT, y: -7.7, z: TEXT_Z_POSITION },
      size: 0.55,
    },
  ]
  const CONFIG = {
    regular: {
      ticketColor: isDarkTheme ? 0xf3f3f3 : 0x121212,
      ticketForeground: isDarkTheme ? 0x171717 : 0xffffff,
    },
    platinum: {
      ticketColor: isDarkTheme ? 0x9ea1a1 : 0x9ea1a1,
      ticketForeground: 0x0f0f0f,
    },
    secret: {
      ticketColor: isDarkTheme ? 0xe7a938 : 0xf2c66d,
      ticketForeground: 0x0f0f0f,
    },
  }

  const isDesktop = (width: number) => width > 1024
  const getTicketScale = (width: number) => (isDesktop(width) ? 0.35 : 0.3)
  const getTicketXPosition = (width: number, isRight: boolean) =>
    isDesktop(width) ? (isRight ? 5 : -5) : 0

  useKey('Escape', () => {
    resetRotation()
  })

  // Reset handler with smooth transition
  const resetRotation = () => {
    targetRotation.current = { x: 0, y: 0 }
    isFlipped.current = false
    setIsGameMode(false)
  }

  useEffect(() => {
    if (!canvasRef.current) return

    let scale = getTicketScale(window.innerWidth)
    targetScale.current = scale
    const calculateDesktopWidth = () => window.innerWidth
    const initialCanvasWidth = calculateDesktopWidth()
    const initialCanvasHeight = CANVAS_HEIGHT
    const ticketYIdleRotation = 0

    // Initialize scene, camera, and renderer
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      25,
      initialCanvasWidth / initialCanvasHeight,
      0.1,
      1000
    )
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(initialCanvasWidth, initialCanvasHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    canvasRef.current.appendChild(renderer.domElement)

    // Camera setup
    const cameraDistance = 30
    camera.position.z = cameraDistance

    // Rest of your existing setup code (loader, materials, etc.)
    const gltfLoader = new GLTFLoader()

    // Texture credits to Freepik: https://www.freepik.com/free-photo/golden-wall-background_1213228.htm
    const metalTexture = new THREE.TextureLoader().load(
      '/images/launchweek/13/ticket/metal-texture.jpg'
    )
    const goldTexture = new THREE.TextureLoader().load(
      '/images/launchweek/13/ticket/gold-texture.jpg'
    )

    const metalMaterial = new THREE.MeshStandardMaterial({
      color: CONFIG[ticketType].ticketColor,
      map: IS_SECRET ? goldTexture : IS_PLATINUM ? metalTexture : undefined,
      bumpMap: IS_SECRET ? goldTexture : IS_PLATINUM ? metalTexture : undefined,
      metalnessMap: IS_SECRET ? goldTexture : metalTexture,
      // roughnessMap: IS_SECRET ? goldTexture : metalTexture,
      metalness: IS_SECRET ? 0.8 : IS_PLATINUM ? 1.0 : isDarkTheme ? 0.2 : 0.9,
      roughness: IS_SECRET ? 0.12 : IS_PLATINUM ? 0.22 : isDarkTheme ? 0.2 : 0.5,
      bumpScale: IS_SECRET ? 0.02 : IS_PLATINUM ? 0.0045 : undefined,
    })

    // Load Ticket model, fonts and textures
    let ticket3DImport: THREE.Mesh
    const ticketGroup = new THREE.Group()
    const ticketScale = getTicketScale(window.innerWidth)
    ticketGroup.scale.set(ticketScale, ticketScale, ticketScale)
    ticketGroup.position.x = getTicketXPosition(window.innerWidth, ALIGN_RIGHT)

    gltfLoader.load('/images/launchweek/13/ticket/3D-ticket.glb', (gltf) => {
      ticket3DImport = gltf.scene.children[0] as THREE.Mesh
      ticket3DImport.rotation.x = Math.PI * 0.5
      ticket3DImport.traverse((child) => {
        if (child) {
          // @ts-ignore
          child.material = metalMaterial
          child.castShadow = true
          child.receiveShadow = true
        }
      })

      ticketGroup.add(ticket3DImport)
      scene.add(ticketGroup)
      ticketRef.current = ticket3DImport
      camera.lookAt(ticket3DImport.position)
    })

    const textMaterial = new THREE.MeshStandardMaterial({
      color: CONFIG[ticketType].ticketForeground,
      metalness: 0.2,
      roughness: 0.35,
    })

    // Load font and add text geometry
    const fontLoader = new FontLoader()

    // Load Inter font
    fontLoader.load('/images/launchweek/13/ticket/Murecho_Regular.json', (font) => {
      DISPLAY_NAME.map((text, index) => {
        // Front
        const textGeometry = new TextGeometry(text, {
          font,
          size: 1.2,
          height: 0.2,
        })
        const textMesh = new THREE.Mesh(textGeometry, textMaterial)
        textMesh.updateMatrix()
        textMesh.position.set(
          TICKET_FONT_PADDING_LEFT,
          -5 + LINE_HEIGHT * (index + 1),
          TEXT_Z_POSITION
        )
        textMesh.castShadow = true
        ticketGroup.add(textMesh)
      })

      // Back
      if (!sharePage) {
        const backTextGeometry = new TextGeometry('Type the secret code', {
          font,
          size: 0.6,
          height: 0.2,
        })
        const backTextMesh = new THREE.Mesh(backTextGeometry, textMaterial)
        backTextMesh.updateMatrix()
        backTextMesh.position.set(4.0, 2, -TEXT_Z_POSITION)
        backTextMesh.rotation.y = Math.PI

        backTextMesh.castShadow = true
        ticketGroup.add(backTextMesh)
      }
    })

    // Load mono font
    fontLoader.load('/images/launchweek/13/ticket/SourceCodePro_Regular.json', (font) => {
      // Front
      FOOTER_CONTENT.map((line) => {
        const textGeometry = new TextGeometry(line.text, {
          font,
          size: line.size,
          height: 0.2,
        })
        const textMesh = new THREE.Mesh(textGeometry, textMaterial)
        textMesh.updateMatrix()
        textMesh.position.set(line.position.x, line.position.y, line.position.z)
        textMesh.castShadow = true
        ticketGroup.add(textMesh)
      })

      // Back
      if (!sharePage) {
        winningPhrase.flat().map((letter, index) => {
          const letterGeometry = new TextGeometry(letter.toUpperCase(), {
            font,
            size: 2.2,
            height: 0.2,
          })
          const letterMaterial = new THREE.MeshStandardMaterial({
            color: CONFIG[ticketType].ticketForeground,
            metalness: 0.2,
            roughness: 0.35,
          })
          const backTextMesh = new THREE.Mesh(letterGeometry, letterMaterial)
          backTextMesh.updateMatrix()
          backTextMesh.position.set(3.9 - index * 1.8, -2, -TEXT_Z_POSITION)
          backTextMesh.rotation.y = Math.PI
          backTextMesh.name = `letter-${index}`
          backTextMesh.material.transparent = true
          backTextMesh.material.opacity = 0

          ticketGroup.add(backTextMesh)
        })
      }
    })

    ticketGroup.updateMatrix()

    // Environment Map
    const envMapLoader = new THREE.TextureLoader()
    envMapLoader.load('/images/launchweek/13/ticket/env-map.jpg', (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping
      scene.environment = texture
      metalMaterial.envMap = texture
      metalMaterial.envMapIntensity = IS_SECRET
        ? isDarkTheme
          ? 1.4
          : 0.9
        : isDarkTheme
          ? 2.8
          : 0.75
    })

    // Lights
    const ambientLight = new THREE.AmbientLight(
      0xffffff,
      IS_SECRET ? (isDarkTheme ? 1.3 : 1.2) : IS_PLATINUM ? (isDarkTheme ? 1.7 : 3.2) : 2
    )
    scene.add(ambientLight)

    const spotLight = new THREE.SpotLight(0xffffff, isDarkTheme ? 0.8 : 0.2)
    spotLight.position.z = ticketGroup.position.z + 8
    spotLight.position.x = ticketGroup.position.x + 10
    spotLight.angle = (Math.PI / 2) * 0.5
    spotLight.castShadow = true
    spotLight.lookAt(ticketGroup.position)
    scene.add(spotLight)

    const getTicketScreenPosition = () => {
      if (!ticketRef.current) return null

      const vector = new THREE.Vector3()
      ticketRef.current.getWorldPosition(vector)
      vector.project(camera)

      const x = (vector.x * 0.5 + 0.5) * initialCanvasWidth
      const y = -(vector.y * 0.5 - 0.5) * initialCanvasHeight

      return { x, y }
    }

    const handleKeyDown = () => {
      currentValue.current.split('').map((_letter, index) => {
        const letterToShow = ticketGroup.getObjectByName(`letter-${index}`)
        letterToShow?.traverse((child) => {
          if (child) {
            // @ts-ignore
            child.material.opacity = 1
          }
        })
      })
    }

    const animate = () => {
      // Smooth rotation
      if (!isDragging.current) {
        ticketGroup.rotation.x += (targetRotation.current.x - ticketGroup.rotation.x) * 0.18
        ticketGroup.rotation.y +=
          ticketYIdleRotation + (targetRotation.current.y - ticketGroup.rotation.y) * 0.18
      }
      if (ticketGroup.scale.x < targetScale.current) {
        scale += 0.0025
      } else if (ticketGroup.scale.x > targetScale.current) {
        scale -= 0.0025
      } else {
        scale = targetScale.current
      }

      ticketGroup.scale.set(scale, scale, scale)
      groupYRotation.current = ticketGroup.rotation.y

      handleKeyDown()

      renderer.render(scene, camera)
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    // Start animation
    animate()

    const handleMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY)
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      handlePointerMove(touch.clientX, touch.clientY)
    }
    // Tilt and drag logic
    const handlePointerMove = (clientX: number, clientY: number) => {
      if (!canvasRef.current) return
      if (isDragging.current) {
        // Update drag delta
        if (dragStartX.current !== null) {
          dragDelta.current = clientX - dragStartX.current
          ticketGroup.rotation.y = targetRotation.current.y + dragDelta.current * 0.01
        }
      } else {
        // Get canvas bounds
        const canvasRect = canvasRef.current.getBoundingClientRect()

        // Calculate center of the canvas
        const centerX = canvasRect.left + canvasRect.width / 2
        const centerY = canvasRect.top + canvasRect.height / 2
        const ticketPosition = getTicketScreenPosition() || { x: centerX, y: centerY }

        // Calculate distance from cursor to center of ticket
        const deltaX = clientX - (canvasRect.left + ticketPosition.x)
        const deltaY = clientY - (canvasRect.top + ticketPosition.y)
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

        // Maximum distance for sensitivity calculation (diagonal of the canvas)
        const maxDistance = Math.sqrt(
          Math.pow(canvasRect.width / 2, 2) + Math.pow(canvasRect.height / 2, 2)
        )

        // Calculate sensitivity based on distance (inverse relationship)
        const sensitivity = 0.002 * (1 - Math.min(distance / maxDistance, 1))

        // Update target rotation with distance-based sensitivity
        targetRotation.current.y =
          deltaX * sensitivity +
          (isFlipped.current ? (flipDirection.current < 0 ? -Math.PI : Math.PI) : 0)
        targetRotation.current.x = deltaY * sensitivity * 0.3
      }
    }

    const handleMouseDown = (e: MouseEvent) => handlePointerDown(e.clientX)
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      handlePointerDown(touch.clientX)
    }
    const handlePointerDown = (clientX: number) => {
      isDragging.current = true
      dragStartX.current = clientX
      targetScale.current += SCALE_VARIATION_ON_INTERACTION
    }

    const handleMouseUp = () => handlePointerUp()
    const handleTouchEnd = () => handlePointerUp()

    const handlePointerUp = () => {
      if (!isDragging.current) return
      isDragging.current = false
      targetScale.current -= SCALE_VARIATION_ON_INTERACTION

      // Detect swipe gesture
      if (Math.abs(dragDelta.current) > FLIP_DELTA) {
        // Flip the ticket
        isFlipped.current = !isFlipped.current
        if (!userData.secret) setIsGameMode(isFlipped.current)
        const sign = Math.sign(dragDelta.current)
        flipDirection.current = sign
        targetRotation.current.y += sign * Math.PI // Add full flip
      } else {
        // Reset rotation
        ticketGroup.rotation.y = targetRotation.current.y
      }

      // Reset drag state
      dragStartX.current = null
      dragDelta.current = 0
    }

    // Handle window resize
    const handleResize = () => {
      const newWidth = calculateDesktopWidth()
      ticketGroup.position.x = getTicketXPosition(window.innerWidth, ALIGN_RIGHT)
      const tickeScale = getTicketScale(window.innerWidth)
      ticketGroup.scale.set(tickeScale, tickeScale, tickeScale)
      camera.aspect = newWidth / CANVAS_HEIGHT
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, CANVAS_HEIGHT)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (isGameMode) return
      const newKey = event.key.toLocaleLowerCase()

      if (!(event.metaKey || event.ctrlKey) && VALID_KEYS.includes(newKey)) {
        targetScale.current += SCALE_VARIATION_ON_INTERACTION
      }

      setTimeout(() => {
        targetScale.current = getTicketScale(window.innerWidth)
      }, 100)
    }

    // Event listeners
    window.addEventListener('resize', handleResize)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mousemove', handleMouseMove)
    // window.addEventListener('mouseout', resetRotation)
    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchend', handleTouchEnd)
    window.addEventListener('touchcancel', resetRotation)
    window.addEventListener('keydown', onKeyDown)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)
      // window.removeEventListener('mouseout', resetRotation)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('touchcancel', resetRotation)
      window.removeEventListener('keydown', onKeyDown)

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      canvasRef.current?.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [username, isDarkTheme, ticketType])

  useEffect(() => {
    currentValue.current = value
  }, [value])

  return (
    <div
      className={cn(
        'w-screen absolute inset-0 lg:h-full lg:min-h-full lg:max-h-[1000px] flex justify-end items-center overflow-hidden pointer-events-none',
        className
      )}
    >
      <div ref={canvasRef} className="w-full lg:h-full" />
      {isGameMode && !hasWon && !sharePage && (
        <InputOTP
          ref={inputRef}
          maxLength={phraseLength}
          pattern={REGEXP_ONLY_CHARS}
          autoFocus
          containerClassName={cn(
            '!absolute flex justify-center w-full inset-0 bottom-[33%] top-auto lg:!invisible lg:!opacity-0',
            !hasWon && 'lw13-game-input'
          )}
          inputMode="text"
          value={value}
          spellCheck={false}
          onComplete={() => setGameState('winner')}
        >
          {winningPhrase.map((word, w_idx) => (
            <>
              <InputOTPGroup key={`${word}-${word.join('')}-${w_idx}`}>
                {word.map((_, c_idx) => {
                  // index is sum of every letter of every previous word + index of current wo
                  const currentIndex = handleIndexCount(w_idx, c_idx)
                  return (
                    <InputOTPSlot
                      key={`otp-${currentIndex}`}
                      index={currentIndex}
                      className="!text-base bg-background"
                    />
                  )
                })}
              </InputOTPGroup>
              {w_idx !== winningPhrase.length - 1 && <InputOTPSeparator className="mx-1" />}
            </>
          ))}
        </InputOTP>
      )}
    </div>
  )
}

export default ThreeTicketCanvas
