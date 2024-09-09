import Image from 'next/image'
import React from 'react'

const DataAPIsVisual = () => (
  <>
    <Image
      src={`/images/index/products/data-apis-dark.svg`}
      alt="Supabase restful DataAPIs"
      fill
      sizes="100%"
      quality={100}
      className="hidden dark:block absolute inset-0 z-0 object-contain object-center bottom-0"
    />
    <Image
      src={`/images/index/products/data-apis-light.svg`}
      alt="Supabase restful DataAPIs"
      fill
      sizes="100%"
      quality={100}
      className="dark:hidden absolute inset-0 z-0 object-contain object-center bottom-0"
    />
  </>
)

export default DataAPIsVisual
