import classNames from 'classnames'
import { ComponentPropsWithRef, PropsWithChildren, forwardRef } from 'react'

type SectionContainerProps = PropsWithChildren<{
  useSectionTag?: boolean
}> &
  ComponentPropsWithRef<'div'>

// PROOF: ComponentPropsWithoutRef<"div"> & ComponentPropsWithoutRef<"section"> are same!

// type ExtractTypeOf<TypeAliase> = {
//   [Key in keyof TypeAliase]: TypeAliase[Key]
// }
// type DivPropsExtract = ExtractTypeOf<ComponentPropsWithoutRef<"div">>
// type SectionPropsExtract = ExtractTypeOf<ComponentPropsWithoutRef<"section">>
// type HoverThisToSeeTrue = DivPropsExtract extends SectionPropsExtract ? SectionPropsExtract extends DivPropsExtract ? true : false

const SectionContainer = forwardRef<HTMLDivElement, SectionContainerProps>(
  ({ children, className, useSectionTag, ...props }, ref) => {
    const HTMLTagName = useSectionTag ? 'section' : 'div'
    const classNameConcat = classNames(
      `sm:py-18 container relative mx-auto px-6 py-16 md:py-24 lg:px-16 lg:py-24 xl:px-20`,
      className
    )
    return (
      <HTMLTagName {...props} ref={ref} className={classNameConcat}>
        {children}
      </HTMLTagName>
    )
  }
)

export default SectionContainer
