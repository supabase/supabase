import { useParams } from 'common'
import { useEffect } from 'react'
import { Badge, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'

import { DOCS_RESOURCE_CONTENT } from '../ProjectAPIDocs.constants'
import ResourceContent from '../ResourceContent'
import type { ContentProps } from './Content.types'
import { useProjectJsonSchemaQuery } from '@/data/docs/project-json-schema-query'
import { useOpenAPISpecQuery } from '@/data/open-api/api-spec-query'
import { useAppStateSnapshot } from '@/state/app-state'

export const RPC = ({ language }: ContentProps) => {
  const { ref } = useParams()
  const snap = useAppStateSnapshot()

  const { data: jsonSchema, refetch: refetchJsonSchema } = useProjectJsonSchemaQuery({
    projectRef: ref,
  })
  const { data, refetch: refetchOpenAPISpec } = useOpenAPISpecQuery({ projectRef: ref })
  const functions = data?.functions ?? []

  const rpcName = snap.activeDocsSection[1]
  const rpc = functions.find((fn) => fn.name === rpcName)

  const {
    post: { parameters: postParameters },
  } = rpc ?? {}
  const rpcJsonSchema = jsonSchema?.paths[rpc?.path]
  const summary = rpcJsonSchema?.post?.summary

  const rpcParamsObject =
    postParameters &&
    postParameters[0] &&
    postParameters[0].schema &&
    postParameters[0].schema.properties
      ? postParameters[0].schema.properties
      : {}
  const parameters: { name: string; format: string; type: string; required: boolean }[] =
    Object.entries(rpcParamsObject)
      .map(([k, v]: any) => ({
        name: k,
        ...v,
        required: postParameters[0].schema.required.includes(k),
      }))
      .filter((x) => !!x.name)

  useEffect(() => {
    if (rpcName !== undefined) {
      refetchJsonSchema()
      refetchOpenAPISpec()
    }
  }, [rpcName])

  if (rpc === undefined) return null

  return (
    <div className="divide-y">
      <div className="space-y-1 px-4 py-4">
        <h2>{rpc.name}</h2>
        <p className="text-sm text-foreground-light">{summary ?? 'No description available'}</p>
      </div>
      <div className="space-y-2 px-4 py-4">
        <p className="text-sm text-foreground-light">Function arguments</p>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead key="name">Name</TableHead>
                <TableHead key="format">Format</TableHead>
                <TableHead key="type">Type</TableHead>
                <TableHead key="required"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parameters.map((parameter) => (
                <TableRow key={parameter.name}>
                  <TableCell title={parameter.name}>
                    <p className="font-mono text-xs text-foreground truncate">{parameter.name}</p>
                  </TableCell>
                  <TableCell title={parameter.format}>{parameter.format}</TableCell>
                  <TableCell title={parameter.type}>{parameter.type}</TableCell>
                  <TableCell>
                    {parameter.required ? (
                      <Badge variant="warning">Required</Badge>
                    ) : (
                      <Badge variant="default">Optional</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
      <ResourceContent
        selectedLanguage={language}
        snippet={DOCS_RESOURCE_CONTENT.rpcSingle}
        codeSnippets={DOCS_RESOURCE_CONTENT.rpcSingle.code({
          rpcName,
          rpcParams: parameters,
          endpoint: 'endpoint',
          apiKey: 'apiKey',
          showBearer: true,
        })}
      />
    </div>
  )
}
