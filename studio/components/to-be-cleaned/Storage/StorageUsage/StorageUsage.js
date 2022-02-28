import SVG from 'react-inlinesvg'

const StorageUsage = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <SVG
        src={'/img/storage-usage.svg'}
        alt={'storage-usage'}
        preProcessor={(code) =>
          code.replace(/svg/, 'svg class="w-20 h-20 text-color-inherit opacity-75"')
        }
      />
      <p className="mt-5 text-sm text-scale-1100">Usage statistics for storage are coming soon.</p>
    </div>
  )
}

export default StorageUsage
