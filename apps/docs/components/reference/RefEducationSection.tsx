import RefSubLayout from '~/layouts/ref/RefSubLayout'
import { MDXRemote } from 'next-mdx-remote'
import components from '~/components'

const RefEducationSection = ({ item, markdownContent, ...rest }) => {
  // gracefully reject pages we can't render
  if (!markdownContent) {
    //console.log(props.item.id)
    return <div></div>
  }

  return (
    <RefSubLayout.EducationSection
      key={item.id}
      title={item.title}
      hideTitle={markdownContent.meta.hideTitle}
      id={item.id}
      slug={item.id}
      icon={markdownContent.meta.icon}
      {...rest}
    >
      <MDXRemote {...markdownContent.content} components={components} />
    </RefSubLayout.EducationSection>
  )
}

export default RefEducationSection
