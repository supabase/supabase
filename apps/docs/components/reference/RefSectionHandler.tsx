import { MDXRemote } from 'next-mdx-remote'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import components from '~/components'
import RefEducationSection from '~/components/reference/RefEducationSection'
import RefFunctionSection from '~/components/reference/RefFunctionSection'
import OldLayout from '~/layouts/Default'
import RefSubLayout from '~/layouts/ref/RefSubLayout'
import ApiOperationSection from './ApiOperationSection'
import CliCommandSection from './CLICommandSection'

interface Props {
  sections: any[] // to do
  spec: any // to do
  typeSpec: any // to do
  pageProps: any // to do, from staticProps

  type: 'client-lib' | 'cli' | 'api'
}

const RefSectionHandler = (props) => {
  const router = useRouter()

  const slug = router.query.slug[0]

  const isNewDocs = process.env.NEXT_PUBLIC_NEW_DOCS === 'true'

  // When user lands on a url like http://supabase.com/docs/reference/javascript/sign-up
  // find the #sign-up element and scroll to that
  useEffect(() => {
    if (isNewDocs && document && slug !== 'start') {
      document.querySelector(`#${slug}`) && document.querySelector(`#${slug}`).scrollIntoView()
    }
  })

  /*
   * handle old ref pages
   */
  if (!isNewDocs) {
    return (
      // @ts-ignore
      <OldLayout meta={props.pageProps.meta} toc={props.pageProps.toc}>
        <MDXRemote {...props.pageProps.content} components={components} />
      </OldLayout>
    )
  }

  return (
    <RefSubLayout>
      {props.sections.map((x) => {
        switch (x.type) {
          case 'markdown':
            const markdownData = props.pageProps.docs.find((doc) => doc.id === x.id)

            return <RefEducationSection item={x} markdownContent={markdownData} />
            break
          case 'function':
            return (
              <RefFunctionSection
                funcData={x}
                commonFuncData={x}
                spec={props.spec}
                typeSpec={props.typeSpec}
              />
            )
          case 'cli-command':
            return <CliCommandSection funcData={x} commonFuncData={x} spec={props.spec} />
            break
          case 'operation':
            return <ApiOperationSection funcData={x} commonFuncData={x} spec={props.spec} />
          default:
            return (
              <RefFunctionSection
                funcData={x}
                commonFuncData={x}
                spec={props.spec}
                typeSpec={props.typeSpec}
              />
            )
            break
        }
      })}
    </RefSubLayout>
  )
}

export default RefSectionHandler
