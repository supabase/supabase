import RefSubLayout from '~/layouts/ref/RefSubLayout'
import { MDXRemote } from 'next-mdx-remote'
import components from '~/components'

const RefEducationSection = (props) => {
  // gracefully reject pages we can't render
  if (!props.markdownContent) return <></>

  return (
    <RefSubLayout.EducationSection
      key={props.item.id}
      title={props.item.title}
      hideTitle={props.markdownContent.meta.hideTitle}
      id={props.item.id}
      slug={props.item.id}
      scrollSpyHeader={true}
    >
      <MDXRemote {...props.markdownContent.content} components={components} />
    </RefSubLayout.EducationSection>
  )
}

export default RefEducationSection
