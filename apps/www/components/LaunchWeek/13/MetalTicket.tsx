'use client'

import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { useParams } from 'common'
import { cn } from 'ui'

const ThreeCanvas: React.FC<{
  username: string
  className?: string
  ticketPosition?: 'left' | 'right'
}> = ({ username = 'Francesco Sansalvadore', className, ticketPosition = 'right' }) => {
  const params = useParams()
  const canvasRef = useRef<HTMLDivElement>(null)
  const ticketRef = useRef<THREE.Mesh | null>(null)
  const animationFrameRef = useRef<number>()
  const targetRotation = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const textLines = params?.username?.split(' ').reverse() || username?.split(' ').reverse() || []
  const LINE_HEIGHT = 1.4
  const MIN_CANVAS_HEIGHT = 600
  const positionRight = ticketPosition === 'right'

  useEffect(() => {
    if (!canvasRef.current) return

    const isDesktop = (width: number) => width > 1024
    const calculateDesktopWidth = () => window.innerWidth
    const initialCanvasWidth = window.innerWidth
    const initialCanvasHeight =
      window.innerHeight < MIN_CANVAS_HEIGHT ? MIN_CANVAS_HEIGHT - 65 : window.innerHeight - 65
    const getTicketScale = (width: number) => (isDesktop(width) ? 0.35 : 0.3)
    const getTicketXPosition = (width: number, isRight: boolean) =>
      isDesktop(width) ? (isRight ? 5 : -5) : 0
    const ticketYIdleRotation = isDesktop(window.innerWidth) ? 0 : 0

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
    renderer.shadowMap.enabled = true
    canvasRef.current.appendChild(renderer.domElement)

    // Camera setup
    const cameraDistance = 10
    camera.position.z = cameraDistance

    // Rest of your existing setup code (loader, materials, etc.)
    const loader = new GLTFLoader()
    const metalTexture = new THREE.TextureLoader().load('/images/launchweek/13/ticket/2000px.avif')
    const metalMaterial = new THREE.MeshStandardMaterial({
      map: metalTexture,
      color: 0x9ea1a1,
      metalness: 0.9,
      roughness: 0.25,
    })

    // Environment Map
    const rgbeLoader = new RGBELoader()
    rgbeLoader.load('/images/launchweek/13/ticket/canary_wharf_1k.hdr', (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping
      scene.environment = texture
      metalMaterial.envMap = texture
      metalMaterial.envMapIntensity = 7
    })

    let ticket3DImport: THREE.Mesh
    const ticketGroup = new THREE.Group()
    ticketGroup.position.x = getTicketXPosition(window.innerWidth, positionRight)
    const ticketScale = getTicketScale(window.innerWidth)
    ticketGroup.scale.set(ticketScale, ticketScale, ticketScale)

    loader.load('/images/launchweek/13/ticket/3D-ticket.glb', (gltf) => {
      ticket3DImport = gltf.scene.children[0] as THREE.Mesh
      ticket3DImport.rotation.x = Math.PI * 0.5

      ticket3DImport.traverse((child) => {
        if (child) {
          // @ts-ignore
          child.material = metalMaterial
          child.receiveShadow = true
        }
      })

      ticketGroup.add(ticket3DImport)
      scene.add(ticketGroup)
      ticketRef.current = ticket3DImport
      camera.lookAt(ticket3DImport.position)

      // Load font and add text geometry
      const fontLoader = new FontLoader()
      fontLoader.load('/images/launchweek/13/ticket/Inter_Regular.json', (font) => {
        const textMaterial = new THREE.MeshStandardMaterial({
          color: 0x0f0f0f,
          metalness: 0.8,
          roughness: 0.55,
        })

        ticket3DImport.updateMatrix()

        const PADDING_LEFT = -6.4

        textLines.map((text, index) => {
          const textGeometry = new TextGeometry(text, {
            font,
            size: 1.0,
            height: 0.4,
          })
          const textMesh = new THREE.Mesh(textGeometry, textMaterial)
          textMesh.updateMatrix()
          // textMesh.position.set(-5.8, -5 + LINE_HEIGHT * (index + 1), -0.2)
          textMesh.position.set(PADDING_LEFT, -5 + LINE_HEIGHT * (index + 1), -0.2)
          textMesh.castShadow = true
          ticketGroup.add(textMesh)
        })

        const footerContent = [
          {
            text: 'LAUNCH WEEK 13',
            position: { x: PADDING_LEFT, y: -6.8, z: -0.2 },
            size: 0.59,
          },
          {
            text: '2-6 DEC 2024',
            position: { x: PADDING_LEFT, y: -7.7, z: -0.2 },
            size: 0.55,
          },
        ]

        footerContent.map((line) => {
          const textGeometry = new TextGeometry(line.text, {
            font,
            size: line.size,
            height: 0.4,
          })
          const textMesh = new THREE.Mesh(textGeometry, textMaterial)
          textMesh.updateMatrix()
          textMesh.position.set(line.position.x, line.position.y, line.position.z)
          textMesh.castShadow = true
          ticketGroup.add(textMesh)
        })

        camera.position.x = 0
      })
    })

    camera.position.z = 30

    const getTicketScreenPosition = () => {
      if (!ticketRef.current) return null

      const vector = new THREE.Vector3()
      ticketRef.current.getWorldPosition(vector)
      vector.project(camera)

      const x = (vector.x * 0.5 + 0.5) * initialCanvasWidth
      const y = -(vector.y * 0.5 - 0.5) * initialCanvasHeight

      return { x, y }
    }

    // Animation function with smooth transitions
    const animate = () => {
      // Smooth interpolation
      ticketGroup.rotation.x += (targetRotation.current.x - ticketGroup.rotation.x) * 0.1
      ticketGroup.rotation.y +=
        ticketYIdleRotation + (targetRotation.current.y - ticketGroup.rotation.y) * 0.1
      ticketGroup.rotation.z = 0

      renderer.render(scene, camera)
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    // Start animation
    animate()

    // Mouse movement handler with distance-based sensitivity
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return

      // Get canvas bounds
      const canvasRect = canvasRef.current.getBoundingClientRect()

      // Calculate center of the canvas
      const centerX = canvasRect.left + canvasRect.width / 2
      const centerY = canvasRect.top + canvasRect.height / 2

      const ticketPosition = getTicketScreenPosition() || { x: centerX, y: centerY }

      // Calculate distance from cursor to center of ticket
      const deltaX = e.clientX - (canvasRect.left + ticketPosition.x)
      const deltaY = e.clientY - (canvasRect.top + ticketPosition.y)
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      // Maximum distance for sensitivity calculation (diagonal of the canvas)
      const maxDistance = Math.sqrt(
        Math.pow(canvasRect.width / 2, 2) + Math.pow(canvasRect.height / 2, 2)
      )

      // Calculate sensitivity based on distance (inverse relationship)
      const sensitivity = 0.002 * (1 - Math.min(distance / maxDistance, 1))

      // Update target rotation with distance-based sensitivity
      targetRotation.current.y = deltaX * sensitivity
      targetRotation.current.x = deltaY * sensitivity * 0.3
    }

    // Reset handler with smooth transition
    const resetRotation = () => {
      targetRotation.current = { x: 0, y: 0 }
    }

    // Handle window resize
    const handleResize = () => {
      const newWidth = isDesktop(window.innerWidth) ? calculateDesktopWidth() : window.innerWidth
      ticketGroup.position.x = getTicketXPosition(window.innerWidth, positionRight)
      const tickeScale = getTicketScale(window.innerWidth)
      ticketGroup.scale.set(tickeScale, tickeScale, tickeScale)
      camera.aspect =
        newWidth /
        (window.innerHeight < MIN_CANVAS_HEIGHT ? MIN_CANVAS_HEIGHT - 65 : window.innerHeight - 65)
      camera.updateProjectionMatrix()
      renderer.setSize(
        newWidth,
        window.innerHeight < MIN_CANVAS_HEIGHT ? MIN_CANVAS_HEIGHT - 65 : window.innerHeight - 65
      )
    }

    // Event listeners
    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseout', resetRotation)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseout', resetRotation)

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      canvasRef.current?.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [params])

  return (
    <div
      className={cn(
        'w-screen absolute inset-0 lg:h-full flex justify-end items-center overflow-hidden pointer-events-none',
        className
      )}
    >
      <div ref={canvasRef} className="w-full lg:h-full" />
    </div>
  )
}

export default ThreeCanvas
