import React, { useState } from 'react'

import { Image } from '.'

export default {
  title: 'General/Image',
  component: Image,
}

export const Normal = (args: any) => {
  return (
    <>
      <Image {...args} />
    </>
  )
}

export const Circle = (args: any) => {
  return (
    <>
      <Image {...args} />
    </>
  )
}

export const Rounded = (args: any) => {
  return (
    <>
      <Image {...args} />
    </>
  )
}

export const Responsive = (args: any) => {
  return (
    <>
      <Image {...args} />
    </>
  )
}

Normal.args = {
  active: true,
  source: 'https://via.placeholder.com/300'
}

Circle.args = {
    active: true,
    type: 'circle',
    source: 'https://via.placeholder.com/300'
}

Rounded.args = {
  active: true,
  type: 'rounded',
  source: 'https://via.placeholder.com/300'
}

Responsive.args = {
  active: true,
  type: 'normal',
  source: 'https://via.placeholder.com/300',
  responsive: true

}