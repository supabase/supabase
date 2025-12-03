import { Eye, EyeOff } from 'lucide-react'
import { useMemo, useState } from 'react'

import { useParams } from 'common'
import CommandRender from 'components/interfaces/Functions/CommandRender'
import { convertKVStringArrayToJson } from 'components/interfaces/Integrations/Wrappers/Wrappers.utils'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import CopyButton from 'components/ui/CopyButton'
import { InlineLink } from 'components/ui/InlineLink'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import {
  getDecryptedValues,
  useVaultSecretDecryptedValueQuery,
} from 'data/vault/vault-secret-decrypted-value-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import {
  Accordion_Shadcn_,
  AccordionContent_Shadcn_,
  AccordionItem_Shadcn_,
  AccordionTrigger_Shadcn_,
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
  CodeBlock,
} from 'ui'
import { useAnalyticsBucketWrapperInstance } from '../useAnalyticsBucketWrapperInstance'
import { getPyicebergSnippet } from './CreateTableInstructions.constants'

export const CreateTableInstructions = ({
  hideHeader = false,
  className,
}: {
  hideHeader?: boolean
  className?: string
}) => {
  const { ref, bucketId } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [showKeys, setShowKeys] = useState(false)
  const [isFetchingSecretsOnCopy, setIsFetchingSecretsOnCopy] = useState(false)

  const { data: projectSettings } = useProjectSettingsV2Query({ projectRef: ref })
  const { data: wrapperInstance } = useAnalyticsBucketWrapperInstance({ bucketId })
  const wrapperValues = convertKVStringArrayToJson(wrapperInstance?.server_options ?? [])

  const s3AccessKeyVaultID = wrapperValues.vault_aws_access_key_id
  const s3SecretKeyVaultID = wrapperValues.vault_aws_secret_access_key
  const tokenVaultID = wrapperValues.vault_token

  const { data: decryptedS3AccessKey, isLoading: isDecryptingS3AccessKey } =
    useVaultSecretDecryptedValueQuery(
      {
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        id: s3AccessKeyVaultID,
      },
      { enabled: showKeys }
    )

  const { data: decryptedS3SecretKey, isLoading: isDecryptingS3SecretKey } =
    useVaultSecretDecryptedValueQuery(
      {
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        id: s3SecretKeyVaultID,
      },
      { enabled: showKeys }
    )

  const { data: decryptedToken, isLoading: isDecryptingToken } = useVaultSecretDecryptedValueQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      id: tokenVaultID,
    },
    { enabled: showKeys }
  )

  const isFetchingSecretValues =
    showKeys && (isDecryptingS3AccessKey || isDecryptingS3SecretKey || isDecryptingToken)

  const snippetContent = useMemo(
    () =>
      getPyicebergSnippet({
        ref,
        warehouse: wrapperValues.warehouse,
        catalogUri: wrapperValues.catalog_uri,
        s3Endpoint: wrapperValues['s3.endpoint'],
        s3Region: projectSettings?.region,
        s3AccessKey: showKeys ? decryptedS3AccessKey : undefined,
        s3SecretKey: showKeys ? decryptedS3SecretKey : undefined,
        token: showKeys ? decryptedToken : undefined,
      }),
    [
      decryptedS3AccessKey,
      decryptedS3SecretKey,
      decryptedToken,
      projectSettings?.region,
      ref,
      showKeys,
      wrapperValues,
    ]
  )

  return (
    <Card className={className}>
      {!hideHeader && (
        <CardHeader>
          <CardTitle>Create your first table via Pyiceberg</CardTitle>
        </CardHeader>
      )}

      <Accordion_Shadcn_ defaultValue={['step-1']} type="multiple">
        <AccordionItem_Shadcn_ value="step-1">
          <AccordionTrigger_Shadcn_ className="px-6 py-3 text-sm">
            <div className="flex items-center gap-x-4">
              <div className="w-6 h-6 rounded-full border flex items-center justify-center text-xs font-mono">
                1
              </div>
              <p className="prose text-sm font-normal">
                Set up Python project with <code>uv</code>
              </p>
            </div>
          </AccordionTrigger_Shadcn_>
          <AccordionContent_Shadcn_ className="border-0 px-6 pt-1">
            <CommandRender
              commands={[
                {
                  comment: '1. Install uv as a preferred package manager',
                  command: 'curl -LsSf https://astral.sh/uv/install.sh | sh',
                  jsx: () => 'curl -LsSf https://astral.sh/uv/install.sh | sh',
                },
                {
                  comment: '2. Initialize a new Python project with uv',
                  command: 'uv init <project-name>',
                  jsx: () => 'uv init <project-name>',
                },
                {
                  comment: '3. Install required packages',
                  command: 'uv add pyiceberg pyarrow pandas',
                  jsx: () => 'uv add pyiceberg pyarrow pandas',
                },
              ]}
            />
          </AccordionContent_Shadcn_>
        </AccordionItem_Shadcn_>

        <AccordionItem_Shadcn_ value="step-2">
          <AccordionTrigger_Shadcn_ className="px-6 py-3 text-sm">
            <div className="flex items-center gap-x-4">
              <div className="w-6 h-6 rounded-full border flex items-center justify-center text-xs font-mono">
                2
              </div>
              <p className="prose text-sm font-normal">
                Replace <code>main.py</code> with the following snippet
              </p>
            </div>
          </AccordionTrigger_Shadcn_>
          <AccordionContent_Shadcn_ className="border-0 px-6 pt-2">
            <p className="text-foreground mb-3 prose max-w-full text-sm">
              The following snippet creates a namespace <code>default</code>, then creates a sample
              table
              <code>events</code> into that namespace.
            </p>
            <div className="relative group">
              <CodeBlock
                hideCopy
                language="python"
                className="max-h-[330px]"
                value={snippetContent}
              />
              <div className="flex items-center gap-x-1.5 absolute top-2 right-2">
                <CopyButton
                  type="default"
                  loading={isFetchingSecretsOnCopy}
                  asyncText={async () => {
                    if (!!decryptedS3AccessKey && !!decryptedS3SecretKey && !!decryptedToken) {
                      return getPyicebergSnippet({
                        ref,
                        warehouse: wrapperValues.warehouse,
                        catalogUri: wrapperValues.catalog_uri,
                        s3Endpoint: wrapperValues['s3.endpoint'],
                        s3Region: projectSettings?.region,
                        s3AccessKey: decryptedS3AccessKey,
                        s3SecretKey: decryptedS3SecretKey,
                        token: decryptedToken,
                      })
                    } else {
                      setIsFetchingSecretsOnCopy(true)
                      const decryptedSecrets = await getDecryptedValues({
                        projectRef: project?.ref,
                        connectionString: project?.connectionString,
                        ids: [s3AccessKeyVaultID, s3SecretKeyVaultID, tokenVaultID],
                      })
                      setIsFetchingSecretsOnCopy(false)
                      return getPyicebergSnippet({
                        ref,
                        warehouse: wrapperValues.warehouse,
                        catalogUri: wrapperValues.catalog_uri,
                        s3Endpoint: wrapperValues['s3.endpoint'],
                        s3Region: projectSettings?.region,
                        s3AccessKey: decryptedSecrets[s3AccessKeyVaultID],
                        s3SecretKey: decryptedSecrets[s3SecretKeyVaultID],
                        token: decryptedSecrets[tokenVaultID],
                      })
                    }
                  }}
                />
                <ButtonTooltip
                  type="default"
                  className="w-7"
                  loading={isFetchingSecretValues}
                  onClick={() => setShowKeys(!showKeys)}
                  icon={showKeys ? <EyeOff /> : <Eye />}
                  tooltip={{
                    content: {
                      side: 'bottom',
                      text: showKeys
                        ? 'Hide keys'
                        : isFetchingSecretValues
                          ? 'Retrieving keys'
                          : 'Reveal keys',
                    },
                  }}
                />
              </div>
            </div>
          </AccordionContent_Shadcn_>
        </AccordionItem_Shadcn_>

        <AccordionItem_Shadcn_ value="step-3">
          <AccordionTrigger_Shadcn_ className="px-6 py-3 text-sm">
            <div className="flex items-center gap-x-4">
              <div className="w-6 h-6 rounded-full border flex items-center justify-center text-xs font-mono">
                3
              </div>
              <p className="prose text-sm font-normal">Run the Python script</p>
            </div>
          </AccordionTrigger_Shadcn_>
          <AccordionContent_Shadcn_ className="border-0 px-6 pt-2">
            <CommandRender
              commands={[
                {
                  comment: 'Run the main.py script with uv',
                  command: 'uv run main.py',
                  jsx: () => 'uv run main.py',
                },
              ]}
            />
          </AccordionContent_Shadcn_>
        </AccordionItem_Shadcn_>
      </Accordion_Shadcn_>

      <CardFooter className="bg">
        <p className="text-xs text-foreground-light">
          Connecting to bucket with other Iceberg clients? Read more in our{' '}
          <InlineLink href={`${DOCS_URL}/guides/storage/analytics/examples/pyiceberg`}>
            documentation
          </InlineLink>
          .
        </p>
      </CardFooter>
    </Card>
  )
}
