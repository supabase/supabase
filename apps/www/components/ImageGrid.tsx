import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

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
  animated?: boolean
}

const ImageGrid = ({
  images,
  smCols = 3,
  mdCols = 6,
  lgCols = 8,
  padding = 8,
  className,
  animated = false,
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
                <div className="scale-100 transform cursor-pointer duration-100 ease-in-out hover:shadow-sm">
                  {children}
                </div>
              </Link>
            )
          } else {
            return children
          }
        }

        const MaybeAnimatedDiv = ({ children, ...rest }: any) =>
          animated ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { delay: i / 10 } }}
              {...rest}
            >
              {children}
            </motion.div>
          ) : (
            <div {...rest}>{children}</div>
          )

        return (
          <Container link={x.link} key={i}>
            <MaybeAnimatedDiv
              key={`${x.name}-${i}`}
              className={`
                  bg-surface-200 col-span-1 flex items-center justify-center 
                  ${x.link && 'hover:bg-overlay-hover'}
                  p-8 ${className}`}
            >
              <div className={`relative h-8 w-full overflow-auto ${imgPadding[padding]}`}>
                <Image
                  layout="fill"
                  src={`${x.image}`}
                  alt={`${x.name} logo`}
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
            </MaybeAnimatedDiv>
          </Container>
        )
      })}
    </div>
  )
}

export default ImageGrid
