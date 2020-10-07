import React from 'react'
import styled from '@emotion/styled'
import tw from '@tailwindcssinjs/macro'

const BaseButton = styled.button(tw`
  cursor-pointer w-full flex
  items-center justify-center px-8 py-3
  border border-transparent text-base leading-6
  font-medium rounded
  text-white bg-green-600
  hover:bg-green-500
  focus[outline-none shadow-outline]
  md:py-4 md:text-lg md:px-10
  transition duration-150 ease-in-out
`)

const Button = ({ className, children, ...props }) => (
  <BaseButton {...props} className={['group', className].join(' ')}>
    {children}
  </BaseButton>
)

export default Button
