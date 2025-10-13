// Reference: advisor-game-example/src/images/textures.js
import { NearestFilter, TextureLoader, RepeatWrapping, Texture } from 'three'

import woodImg from './assets/wood.png'
import grassImg from './assets/grass.jpg'
import dirtImg from './assets/dirt.jpg'

// Export image URLs for dynamic loading
export const textureUrls = {
  wood: woodImg,
  grass: grassImg,
  dirt: dirtImg,
}

// Lazy load textures to avoid SSR issues
let woodTexture: Texture | null = null
let grassTexture: Texture | null = null
let dirtTexture: Texture | null = null
let groundTexture: Texture | null = null

export const getWoodTexture = () => {
  if (!woodTexture) {
    woodTexture = new TextureLoader().load(woodImg)
    woodTexture.magFilter = NearestFilter
  }
  return woodTexture
}

export const getGrassTexture = () => {
  if (!grassTexture) {
    grassTexture = new TextureLoader().load(grassImg)
    grassTexture.magFilter = NearestFilter
  }
  return grassTexture
}

export const getDirtTexture = () => {
  if (!dirtTexture) {
    dirtTexture = new TextureLoader().load(dirtImg)
    dirtTexture.magFilter = NearestFilter
  }
  return dirtTexture
}

export const getGroundTexture = () => {
  if (!groundTexture) {
    groundTexture = new TextureLoader().load(grassImg)
    groundTexture.magFilter = NearestFilter
    groundTexture.wrapS = RepeatWrapping
    groundTexture.wrapT = RepeatWrapping
  }
  return groundTexture
}
