import { useRouter } from 'next/router'
import { useEffect } from 'react'

import RefEducationSection from '~/components/reference/RefEducationSection'
import RefFunctionSection from '~/components/reference/RefFunctionSection'

import RefSubLayout from '~/layouts/ref/RefSubLayout'
import ApiOperationSection from './ApiOperationSection'
import CliCommandSection from './CLICommandSection'
import { IAPISpec, ICommonFunc, IRefStaticDoc, ISpec, TypeSpec } from './Reference.types'

interface RefSectionHandlerProps {
  sections: ICommonFunc[]
  spec?: ISpec | IAPISpec
  typeSpec?: TypeSpec
  pageProps: { docs: IRefStaticDoc[] }
  type: 'client-lib' | 'cli' | 'api'
}

const RefSectionHandler = (props: RefSectionHandlerProps) => {
  const router = useRouter()

  const slug = router.query.slug[0]

  // When user lands on a url like http://supabase.com/docs/reference/javascript/sign-up
  // find the #sign-up element and scroll to that
  useEffect(() => {
    if (document && slug !== 'start') {
      document.querySelector(`#${slug}`) && document.querySelector(`#${slug}`).scrollIntoView()
    }
  })

  return (
    <RefSubLayout>
      {props.sections.map((x, i) => {
        switch (x.type) {
          case 'markdown':
            const markdownData = props.pageProps.docs.find((doc) => doc.id === x.id)

            return <RefEducationSection key={x.id + i} item={x} markdownContent={markdownData} />
            break
          case 'function':
            return (
              <RefFunctionSection
                key={x.id + i}
                funcData={x}
                commonFuncData={x}
                spec={props.spec}
                typeSpec={props.typeSpec}
              />
            )
          case 'cli-command':
            return <CliCommandSection key={x.id + i} funcData={x} commonFuncData={x} />
            break
          case 'operation':
            return (
              <ApiOperationSection
                key={x.id + i}
                funcData={x}
                commonFuncData={x}
                spec={props.spec}
              />
            )
          default:
            return (
              <RefFunctionSection
                key={x.id + i}
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
