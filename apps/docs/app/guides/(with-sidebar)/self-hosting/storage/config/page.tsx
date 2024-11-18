import Param from '~/components/Params'
import { genGuideMeta } from '~/features/docs/GuidesMdx.utils'
import { GuideTemplate, newEditLink } from '~/features/docs/GuidesMdx.template'
import { MDXRemoteBase } from '~/features/docs/MdxBase'
import specStorageV0 from '~/spec/storage_v0_config.yaml' assert { type: 'yml' }

const meta = {
  title: 'Storage Self-hosting Config',
  description: 'How to configure and deploy Supabase Storage.',
}

const generateMetadata = genGuideMeta(() => ({
  pathname: '/guides/self-hosting/storage/config',
  meta,
}))

const StorageConfigPage = async () => {
  const descriptionMdx = specStorageV0.info.description

  return (
    <GuideTemplate
      meta={meta}
      editLink={newEditLink(
        'supabase/supabase/blob/master/apps/docs/app/guides/(with-sidebar)/self-hosting/storage/config/page.tsx'
      )}
    >
      <MDXRemoteBase source={descriptionMdx} />

      <div>
        {specStorageV0.info.tags.map((tag: ReturnType<typeof specStorageV0>['info']['tags']) => {
          return (
            <>
              <h2 className="text-foreground">{tag.title}</h2>
              <p className="text-foreground-lighter">{tag.description}</p>
              <div className="not-prose">
                <h5 className="text-base text-foreground mb-3">Parameters</h5>
                <ul>
                  {specStorageV0.parameters
                    .filter((param: ReturnType<typeof specStorageV0>['parameters']) =>
                      param.tags.includes(tag.id)
                    )
                    .map((param: ReturnType<typeof specStorageV0>['parameters']) => {
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

export default StorageConfigPage
export { generateMetadata }
