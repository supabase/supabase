import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, Ref } from 'react'
import { cn } from 'ui'

const sectionContainerVariants = cva('section-container relative', {
  variants: {
    width: {
      normal: '',
      smallScreenFull: 'max-w-full lg:container px-0',
    },
    height: {
      normal: 'py-16 md:py-18 lg:py-24',
      narrow: 'py-6 md:py-8 lg:py-8 xl:py-10',
      none: '',
    },
    spacing: {
      none: '',
      sections: 'space-y-8 md:space-y-16',
    },
  },
  defaultVariants: {
    width: 'normal',
    height: 'normal',
    spacing: 'none',
  },
})

interface Props extends VariantProps<typeof sectionContainerVariants> {
  children: React.ReactNode
  className?: string
  id?: string
}

/**
 * To have tailwind classes applied correctly, use this component instead of SectionContainer
 *
 * @param width - 'normal' (default) or 'full'
 * @param height - 'normal' (default) or 'narrow'
 */
const SectionContainerWithCn = forwardRef(
  ({ children, className, id, width, height, spacing }: Props, ref: Ref<HTMLDivElement>) => (
    <div
      ref={ref}
      id={id}
      className={cn(sectionContainerVariants({ width, height, spacing }), className)}
    >
      {children}
    </div>
  )
)

SectionContainerWithCn.displayName = 'SectionContainerWithCn'

export default SectionContainerWithCn
