import { useRouter } from 'next/router'
import Image from 'next/image'

import Link from 'next/link'
interface iImages {
  name: string
  image: string
  alt?: string
  link?: string
}

type colSizes = 8 | 6 | 4 | 3
type paddingSizes = 6 | 8 | 12

interface iImageGrid {
  images: iImages[]
  smCols?: colSizes
  mdCols?: colSizes
  lgCols?: colSizes
  padding?: paddingSizes
  className?: string
}

const ImageGrid = ({
  images,
  smCols = 3,
  mdCols = 6,
  lgCols = 8,
  padding = 8,
  className,
}: iImageGrid) => {
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

  const imgPadding = {
    6: 'h-6 ',
    8: 'h-8 ',
    12: 'h-12 ',
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
        const Container = ({ children, link }: any) => {
          if (x.link) {
            return (
              <Link href={link}>
                <div className="scale-100 transform cursor-pointer duration-100 ease-in-out hover:z-50 hover:scale-105 hover:shadow-sm">
                  {children}
                </div>
              </Link>
            )
          } else {
            return children
          }
        }

        return (
          <Container link={x.link} key={i}>
            <div
              key={`${x.name}-${i}`}
              className={`
                  dark:bg-scale-400 col-span-1 flex items-center 
                justify-center 
                bg-gray-50
                  ${x.link && 'dark:hover:bg-scale-600 hover:bg-gray-100'}
                  p-8 ${className}`}
            >
              <div
                className={`relative h-8 w-full overflow-auto
                    ${imgPadding[padding]}
                  `}
              >
                <Image
                  layout="fill"
                  src={`${x.image}`}
                  alt={x.alt}
                  objectFit="scale-down"
                  objectPosition="center"
                  className="
                      bg-no-repeat
                    opacity-50 
                    contrast-0
                    filter
                  "
                />
              </div>
            </div>
          </Container>
        )
      })}
    </div>
  )
}

export default ImageGrid
