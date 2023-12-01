import React, { useState } from 'react'

import { Loading } from '.'

export default {
  title: 'Utilities/Loading',
  component: Loading,
}

export const Default = (args: any) => {
  return (
    <>
      <Loading {...args}>
        <div title={'This card can be set to loading'} className="w-96 h-96 background"></div>
      </Loading>
    </>
  )
}

Default.args = {
  active: true,
}
