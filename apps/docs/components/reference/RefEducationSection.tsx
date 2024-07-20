import RefSubLayout from '~/layouts/ref/RefSubLayout'
import { MDXRemote } from 'next-mdx-remote'
import components from '~/components'
import { getMDXComponent } from 'mdx-bundler/client'
import { MDXProvider, useMDXComponents } from '@mdx-js/react'
import { useMemo } from 'react'
const MDX_GLOBAL_CONFIG = {
  MdxJsReact: {
    useMDXComponents,
  },
}

const RefEducationSection = (props) => {
  const Component = useMemo(
    () =>
      props.markdownContent.content
        ? getMDXComponent(props.markdownContent.content, MDX_GLOBAL_CONFIG)
        : '',
    [props.markdownContent.content]
  )

  // gracefully reject pages we can't render
  if (!props.markdownContent) {
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
      <MDXProvider components={components}>
        <Component />
      </MDXProvider>
    </RefSubLayout.EducationSection>
  )
}

export default RefEducationSection
