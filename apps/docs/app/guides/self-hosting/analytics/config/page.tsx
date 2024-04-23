import Param from '~/components/Params'
import { genGuideMeta } from '~/features/docs/GuidesMdx.utils'
import { GuideTemplate, MDXRemoteGuides, newEditLink } from '~/features/docs/GuidesMdx.template'
import { getAnalyticsConfigV0 } from '~/lib/mdx/getConfig'

const meta = {
  title: 'Analytics Self-hosting Config',
  description: 'How to configure and deploy Supabase Analytics.',
}

const generateMetadata = genGuideMeta(() => ({
  pathname: '/guides/self-hosting/analytics/config',
  meta,
}))

const AnalyticsConfigPage = async () => {
  const spec = getAnalyticsConfigV0()
  const descriptionMdx = spec.info.description

  return (
    <GuideTemplate
      meta={meta}
      editLink={newEditLink(
        'supabase/supabase/blob/master/apps/docs/pages/guides/self-hosting/analytics/config.tsx'
      )}
    >
      <MDXRemoteGuides source={descriptionMdx} />

      <div>
        {spec.info.tags.map((tag: ReturnType<typeof getAnalyticsConfigV0>['info']['tags']) => {
          return (
            <>
              <h2 className="text-foreground">{tag.title}</h2>
              <p className="text-foreground-lighter">{tag.description}</p>
              <div className="not-prose">
                <h5 className="text-base text-foreground mb-3">Parameters</h5>
                <ul>
                  {spec.parameters
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
    </GuideTemplate>
  )
}

export default AnalyticsConfigPage
export { generateMetadata }
