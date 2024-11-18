import Param from '~/components/Params'
import { genGuideMeta } from '~/features/docs/GuidesMdx.utils'
import { GuideTemplate, newEditLink } from '~/features/docs/GuidesMdx.template'
import { MDXRemoteBase } from '~/features/docs/MdxBase'
import specAuthV1 from '~/spec/gotrue_v1_config.yaml' assert { type: 'yml' }

const meta = {
  title: 'Auth Self-hosting Config',
  description: 'How to configure and deploy Supabase Auth.',
}

const generateMetadata = genGuideMeta(() => ({
  pathname: '/guides/self-hosting/auth/config',
  meta,
}))

const AuthConfigPage = async () => {
  const descriptionMdx = specAuthV1.info.description

  return (
    <GuideTemplate
      meta={meta}
      editLink={newEditLink(
        'supabase/supabase/blob/master/apps/docs/app/guides/(with-sidebar)/self-hosting/auth/config/page.tsx'
      )}
    >
      <MDXRemoteBase source={descriptionMdx} />

      <div>
        {specAuthV1.info.tags.map((tag: ReturnType<typeof specAuthV1>['info']['tags']) => {
          return (
            <>
              <h2 className="text-foreground">{tag.title}</h2>
              <p className="text-foreground-lighter">{tag.description}</p>
              <div className="not-prose">
                <h5 className="text-base text-foreground mb-3">Parameters</h5>
                <ul>
                  {specAuthV1.parameters
                    .filter((param: ReturnType<typeof specAuthV1>['parameters']) =>
                      param.tags.includes(tag.id)
                    )
                    .map((param: ReturnType<typeof specAuthV1>['parameters']) => {
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

export default AuthConfigPage
export { generateMetadata }
