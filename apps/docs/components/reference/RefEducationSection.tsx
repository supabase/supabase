import RefSubLayout from '~/layouts/ref/RefSubLayout'
import { MDXRemote } from 'next-mdx-remote'
import components from '~/components'

const RefEducationSection = (props) => {
  // gracefully reject pages we can't render
  if (!props.markdownContent) {
    //console.log(props.item.id)
    return <div></div>
  }

  return (
    <RefSubLayout.EducationSection
      key={props.item.id}
      title={props.item.title}
      hideTitle={props.markdownContent.meta.hideTitle}
      id={props.item.id}
      slug={props.item.id}
      scrollSpyHeader={true}
      icon={props.markdownContent.meta.icon}
    >
      <MDXRemote {...props.markdownContent.content} components={components} />
    </RefSubLayout.EducationSection>
  )
}

export default RefEducationSection
