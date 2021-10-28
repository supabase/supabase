import { useRouter } from 'next/router'
import Image from 'next/image'

interface iImages {
  name: string
  image: string
  alt?: string
}

type colSizes = 8 | 6 | 4 | 3

interface iImageGrid {
  images: iImages[]
  smCols?: colSizes
  mdCols?: colSizes
  lgCols?: colSizes
}

const ImageGrid = ({ images, smCols = 3, mdCols = 6, lgCols = 8 }: iImageGrid) => {
  const smBreakpoint = {
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    6: 'grid-cols-6',
    8: 'grid-cols-8',
  }

  const mdBreakpoint = {
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    6: 'md:grid-cols-6',
    8: 'md:grid-cols-8',
  }

  const lgBreakpoint = {
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    6: 'lg:grid-cols-6',
    8: 'lg:grid-cols-8',
  }

  return (
    <div
      className={`grid 
      gap-0.5 
    	${smBreakpoint[smCols]}
      ${mdBreakpoint[mdCols]}
      ${lgBreakpoint[lgCols]}
    `}
    >
      {images.map((x, i) => {
        return (
          <div
            key={`${x.name}-${i}`}
            className="col-span-1 flex items-center justify-center bg-gray-50 dark:bg-gray-700 p-8"
          >
            <div className="relative overflow-auto w-full h-8 p-8">
              <Image
                layout="fill"
                src={`${x.image}`}
                alt={x.alt}
                objectFit="scale-down"
                objectPosition="center"
                className="
                      bg-no-repeat
                    filter 
                    contrast-0
                    opacity-50
                  "
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ImageGrid
