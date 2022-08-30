import { FC } from 'react'
import SVG from 'react-inlinesvg'

interface Props {}

const StorageUsage: FC<Props> = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <SVG
        src={'/img/storage-usage.svg'}
        title={'storage-usage'}
        preProcessor={(code) =>
          code.replace(/svg/, 'svg class="w-20 h-20 text-color-inherit opacity-75"')
        }
      />
      <p className="mt-5 text-sm text-scale-1100">Usage statistics for storage are coming soon.</p>
    </div>
  )
}

export default StorageUsage
