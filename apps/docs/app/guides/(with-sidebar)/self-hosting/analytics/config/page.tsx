import Param from '~/components/Params'
import { genGuideMeta } from '~/features/docs/GuidesMdx.utils'
import { GuideTemplate, newEditLink } from '~/features/docs/GuidesMdx.template'
import { MDXRemoteBase } from '~/features/docs/MdxBase'
import specAnalyticsV0 from '~/spec/analytics_v0_config.yaml' assert { type: 'yml' }

const meta = {
  title: 'Analytics Self-hosting Config',
  description: 'How to configure and deploy Supabase Analytics.',
}

const generateMetadata = genGuideMeta(() => ({
  pathname: '/guides/self-hosting/analytics/config',
  meta,
}))

const AnalyticsConfigPage = async () => {
  const descriptionMdx = specAnalyticsV0.info.description

  return (
    <GuideTemplate
      meta={meta}
      editLink={newEditLink(
        'supabase/supabase/blob/master/apps/docs/app/guides/(with-sidebar)/self-hosting/analytics/config/page.tsx'
      )}
    >
      <MDXRemoteBase source={descriptionMdx} />

      <div>
        {specAnalyticsV0.info.tags.map(
          (tag: ReturnType<typeof specAnalyticsV0>['info']['tags']) => {
            return (
              <>
                <h2 className="text-foreground">{tag.title}</h2>
                <p className="text-foreground-lighter">{tag.description}</p>
                <div className="not-prose">
                  <h5 className="text-base text-foreground mb-3">Parameters</h5>
                  <ul>
                    {specAnalyticsV0.parameters
                      .filter((param: ReturnType<typeof specAnalyticsV0>['parameters']) =>
                        param.tags.includes(tag.id)
                      )
                      .map((param: ReturnType<typeof specAnalyticsV0>['parameters']) => {
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
          }
        )}
      </div>
    </GuideTemplate>
  )
}

export default AnalyticsConfigPage
export { generateMetadata }
