'use client'

import { useMountEffect } from 'common/hooks/useMountEffect'

import { attachImageZoom } from './attachImageZoom'

// mount this once in each app. a second mount zooms each image two times
export const ImageZoom = () => {
  useMountEffect(attachImageZoom)
  return null
}
