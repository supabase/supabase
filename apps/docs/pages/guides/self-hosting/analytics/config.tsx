import { type InferGetStaticPropsType, type GetStaticProps } from 'next'
import { MDXRemote } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'

import components from '~/components'
import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import Param from '~/components/Params'
import Layout from '~/layouts/DefaultGuideLayout'
import { getAnalyticsConfigV0 } from '~/lib/mdx/getConfig'

const meta = {
  title: 'Analytics Self-hosting Config',
  description: 'How to configure and deploy Supabase Analytics.',
}

export const getStaticProps = (async () => {
  const spec = getAnalyticsConfigV0()
  const descriptionSource = await serialize(spec.info.description)
  return {
    props: {
      descriptionSource,
      spec,
    },
  }
}) satisfies GetStaticProps

export const Page = (props: InferGetStaticPropsType<typeof getStaticProps>) => (
  <Layout
    meta={meta}
    editLink="/supabase/supabase/blob/master/apps/docs/pages/guides/self-hosting/analytics/config.tsx"
    menuId={MenuId.SelfHosting}
  >
    <MDXRemote {...props.descriptionSource} components={components} />

    <div>
      {props.spec.info.tags.map((tag: ReturnType<typeof getAnalyticsConfigV0>['info']['tags']) => {
        return (
          <>
            <h2 className="text-foreground">{tag.title}</h2>
            <p className="text-foreground-lighter">{tag.description}</p>
            <div className="not-prose">
              <h5 className="text-base text-foreground mb-3">Parameters</h5>
              <ul>
                {props.spec.parameters
                  .filter((param: ReturnType<typeof getAnalyticsConfigV0>['parameters']) =>
                    param.tags.includes(tag.id)
                  )
                  .map((param: ReturnType<typeof getAnalyticsConfigV0>['parameters']) => {
                    return (
                      <Param
                        name={param.title}
                        type={param.type}
                        description={param.description}
                        required={param.required}
                      />
                    )
                  })}
              </ul>
            </div>
          </>
        )
      })}
    </div>
  </Layout>
)

export default Page
