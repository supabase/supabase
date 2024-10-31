'use client'

import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { useParams } from 'common'

const ThreeCanvas: React.FC<{ username: string }> = ({ username = 'Francesco Sansalvadore' }) => {
  // Will come from auth
  const params = useParams()

  const canvasRef = useRef<HTMLDivElement>(null)
  // const textLines = ['Sansalvadore', 'Francesco']
  const textLines = params?.username?.split(' ').reverse() || []
  const LINE_HEIGHT = 1.4

  useEffect(() => {
    if (!canvasRef.current) return

    const isDesktop = window.innerWidth > 768

    // Initialize scene, camera, and renderer
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      75,
      isDesktop
        ? window.innerWidth / 2 / window.innerHeight
        : window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(isDesktop ? window.innerWidth / 2 : window.innerWidth, window.innerHeight)
    renderer.shadowMap.enabled = true
    canvasRef.current.appendChild(renderer.domElement)

    // Controls
    const controls = new OrbitControls(camera, canvasRef.current)
    controls.target.set(0, 0.75, 0)
    controls.autoRotate
    controls.enableDamping = true
    controls.enableZoom = false
    controls.dampingFactor = 0.1
    controls.minPolarAngle = Math.PI / 2
    controls.maxPolarAngle = Math.PI / 2

    const loader = new GLTFLoader()

    // Create a metal material
    const metalTexture = new THREE.TextureLoader().load('/images/launchweek/13/ticket/2000px.avif') // Load a metal texture image
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

    // loader.load('/images/launchweek/13/ticket/3D-ticket-cutout.glb', (gltf) => {
    loader.load('/images/launchweek/13/ticket/3D-ticket-cutout-holes.glb', (gltf) => {
      ticket3DImport = gltf.scene.children[0] as THREE.Mesh
      ticket3DImport.rotation.x = Math.PI * 0.5

      ticket3DImport.traverse((child) => {
        if (child) {
          child.traverse((node) => {
            // @ts-ignore
            child.material = metalMaterial
            child.receiveShadow = true
          })
        }
      })

      scene.add(ticket3DImport)
      camera.lookAt(ticket3DImport.position)

      // Load font and add text geometry as a cut-out
      const fontLoader = new FontLoader()
      fontLoader.load('/images/launchweek/13/ticket/Inter_Regular.json', (font) => {
        const textMaterial = new THREE.MeshStandardMaterial({
          color: 0x0f0f0f,
          metalness: 0.8,
          roughness: 0.55,
        })

        ticket3DImport.updateMatrix()

        textLines.map((text, index) => {
          const textGeometry = new TextGeometry(text, {
            font,
            size: 0.95,
            height: 0.4,
          })
          const textMesh = new THREE.Mesh(textGeometry, textMaterial)
          textMesh.updateMatrix()
          textMesh.position.set(-5.8, -5 + LINE_HEIGHT * (index + 1), -0.2) // Adjust position as needed
          textMesh.castShadow = true
          scene.add(textMesh)

          // if (ticket3DImport) {
          //   ticket3DImport.updateMatrixWorld()
          //   textMesh.updateMatrixWorld()
          //   const csgTicket = CSG.fromMesh(ticket3DImport)
          //   const csgText = CSG.fromMesh(textMesh)

          //   const subtractedMesh = CSG.toMesh(csgTicket.subtract(csgText), ticket3DImport.matrix)
          //   subtractedMesh.material = ticket3DImport.material
          //   scene.remove(ticket3DImport) // Remove old ticket mesh
          //   scene.add(subtractedMesh) // Add new ticket with cut-out
          // }
        })

        const footerContent = [
          {
            text: 'LAUNCH WEEK 13',
            position: { x: -5.8, y: -6.8, z: -0.2 },
            size: 0.59,
          },
          {
            text: '2-6 DEC 2024',
            position: { x: -5.8, y: -7.7, z: -0.2 },
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
          textMesh.position.set(line.position.x, line.position.y, line.position.z) // Adjust position as needed
          textMesh.castShadow = true
          scene.add(textMesh)
        })
      })
    })

    camera.position.z = 30
    const ambientLight = new THREE.AmbientLight(0xffffff, 30)
    // scene.add(ambientLight)

    // Top right light
    const topRightLight = new THREE.SpotLight(0xffffff, 1)
    topRightLight.position.set(2, 8, 10)
    topRightLight.castShadow = true
    // scene.add(topRightLight)

    // Bottom left light
    const bottomLeftLight = new THREE.SpotLight(0x44ff4f, 2)
    bottomLeftLight.position.set(-5, -5, 10)
    bottomLeftLight.target.position.set(0, 0, 0)
    bottomLeftLight.castShadow = true
    // scene.add(bottomLeftLight)

    // const topRightLightHelper = new THREE.SpotLightHelper(topRightLight)
    // const topRightLightCameraHelper = new THREE.CameraHelper(topRightLight.shadow.camera)
    // const bottomLeftLightHelper = new THREE.SpotLightHelper(bottomLeftLight)
    // const bottomLeftLightCameraHelper = new THREE.CameraHelper(bottomLeftLight.shadow.camera)

    // Helpers
    // scene.add(topRightLightHelper)
    // scene.add(topRightLightCameraHelper)
    // scene.add(bottomLeftLightHelper)
    // scene.add(bottomLeftLightCameraHelper)

    // Left light
    const leftLight = new THREE.PointLight(0xffffff, 0.015)
    leftLight.position.set(50, 0, 100)
    leftLight.castShadow = true
    // scene.add(leftLight)

    // Right light
    const rightLight = new THREE.PointLight(0xffffff, 0.015)
    rightLight.position.set(-50, 0, 100)
    rightLight.castShadow = true
    // scene.add(rightLight)

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }

    animate()

    // Handle window resize
    const handleResize = () => {
      const isDesktop = window.innerWidth > 768
      camera.aspect = isDesktop
        ? window.innerWidth / 2 / window.innerHeight
        : window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(isDesktop ? window.innerWidth / 2 : window.innerWidth, window.innerHeight)
    }

    let orbit: THREE.Object3D

    // orbit object on mousemove
    const handleMouseMoveRotate = (e: any) => {
      let scale = -0.001
      orbit.rotateY((e.movementX - 1) * scale)
      orbit.rotateX(e.movementY * scale * 0.1)
      orbit.rotation.z = 0
      // TODO: reset initial rotation when mouse leaves the canvas
    }

    //the camera rotation pivot
    orbit = new THREE.Object3D()
    orbit.rotation.order = 'YXZ' //this is important to keep level, so Z should be the last axis to rotate in order...
    // orbit.position.copy( ticket.position );
    scene.add(orbit)

    //offset the camera and add it to the pivot
    //you could adapt the code so that you can 'zoom' by changing the z value in camera.position in a mousewheel event..
    let cameraDistance = 30
    camera.position.z = cameraDistance
    orbit.add(camera)

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMoveRotate)

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMoveRotate)
      canvasRef.current?.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [params])

  return (
    <div className="relative flex justify-end items-center max-h-screen bg-alternative overflow-hidden">
      <div ref={canvasRef} className="w-full md:w-1/2 h-full" />
    </div>
  )
}

export default ThreeCanvas
