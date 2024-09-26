import { isEqual } from 'lodash'
import { ChevronRight, XCircle } from 'lucide-react'
import type { HTMLAttributes, PropsWithChildren } from 'react'

import {
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  cn,
  CodeBlock,
} from 'ui'

import { MDXRemoteBase } from '~/features/docs/MdxBase'
import { MDXRemoteRefs } from '~/features/docs/Reference.mdx'
import type {
  CustomTypePropertyType,
  FunctionParameterType,
  MethodTypes,
  TypeDetails,
} from '~/features/docs/Reference.typeSpec'
import { TYPESPEC_NODE_ANONYMOUS } from '~/features/docs/Reference.typeSpec'
import { ReferenceSectionWrapper } from '~/features/docs/Reference.ui.client'
import { normalizeMarkdown } from '~/features/docs/Reference.utils'
import { getTypeDisplayFromSchema, IApiEndPoint, type ISchema } from './Reference.api.utils'
import { API_REFERENCE_REQUEST_BODY_SCHEMA_DATA_ATTRIBUTES } from './Reference.ui.shared'
import ReactMarkdown from 'react-markdown'
import ApiSchema from '~/components/ApiSchema'

interface SectionProps extends PropsWithChildren {
  link: string
  slug?: string
  columns?: 'single' | 'double'
}

function Section({ slug, link, columns = 'single', children }: SectionProps) {
  const singleColumn = columns === 'single'

  return (
    <ReferenceSectionWrapper
      id={slug}
      link={link}
      className={cn(
        'grid grid-cols-[1fr] gap-x-16 gap-y-8',
        singleColumn ? 'max-w-3xl' : '@4xl/article:grid-cols-[1fr,1fr]'
      )}
    >
      {children}
    </ReferenceSectionWrapper>
  )
}

function Details({ children }: PropsWithChildren) {
  /*
   * `min-w` is necessary because these are used as grid children, which have
   * default `min-w-auto`
   */
  return <div className="w-full min-w-full">{children}</div>
}

function Examples({ children }: PropsWithChildren) {
  /*
   * `min-w` is necessary because these are used as grid children, which have
   * default `min-w-auto`
   */
  return <div className="w-full min-w-full sticky top-32 self-start">{children}</div>
}

function EducationSection({ children, slug, ...props }: SectionProps) {
  return (
    <ReferenceSectionWrapper id={slug} className={'prose max-w-none'} {...props}>
      {children}
    </ReferenceSectionWrapper>
  )
}

interface EducationRowProps extends PropsWithChildren {
  className?: string
}

function EducationRow({ className, children }: EducationRowProps) {
  return <div className={cn('grid lg:grid-cols-2 gap-8 lg:gap-16', className)}>{children}</div>
}

export const RefSubLayout = {
  Section,
  EducationSection,
  EducationRow,
  Details,
  Examples,
}

interface StickyHeaderProps {
  title?: string
  monoFont?: boolean
  className?: string
}

export function StickyHeader({ title, monoFont = false, className }: StickyHeaderProps) {
  return (
    <h2
      tabIndex={-1} // For programmatic focus on auto-scroll to section
      className={cn(
        'sticky top-0 z-10',
        'w-full',
        // Enough padding to cover the background when stuck to the top,
        // then readjust with negative margin to prevent it looking too
        // spaced-out in regular position
        'pt-[calc(var(--header-height)+1rem)] -mt-[calc(var(--header-height)+1rem-2px)]',
        // Same for bottom
        'pb-8 -mb-3',
        'bg-gradient-to-b from-background from-85% to-transparent to-100%',
        'text-2xl font-medium text-foreground',
        'scroll-mt-[calc(var(--header-height)+1rem)]',
        monoFont && 'font-mono',
        className
      )}
    >
      {title}
    </h2>
  )
}

export function CollapsibleDetails({ title, content }: { title: string; content: string }) {
  return (
    <Collapsible_Shadcn_>
      <CollapsibleTrigger_Shadcn_
        className={cn(
          'group',
          'w-full h-8',
          'border bg-surface-100 rounded',
          'px-5',
          'flex items-center gap-3',
          'text-xs text-foreground-light',
          'data-[state=open]:bg-surface-200',
          'data-[state=open]:rounded-b-none data-[state=open]:border-b-0',
          'transition-safe-all ease-out'
        )}
      >
        <ChevronRight
          size={12}
          className="group-data-[state=open]:rotate-90 transition-transform"
        />
        {title}
      </CollapsibleTrigger_Shadcn_>
      <CollapsibleContent_Shadcn_
        className={cn(
          'border border-default bg-surface-100 rounded-b',
          'px-5 py-2',
          'prose max-w-none text-sm'
        )}
      >
        <MDXRemoteRefs source={content} />
      </CollapsibleContent_Shadcn_>
    </Collapsible_Shadcn_>
  )
}

export function FnParameterDetails({
  parameters,
  altParameters,
  className,
}: {
  parameters: Array<object> | undefined
  altParameters?: Array<Array<FunctionParameterType>>
  className?: string
}) {
  if (!parameters || parameters.length === 0) return

  const combinedParameters = altParameters
    ? mergeAlternateParameters(parameters, altParameters)
    : parameters

  return (
    <div className={className ?? ''}>
      <h3 className="mb-3 text-base text-foreground">Parameters</h3>
      <ul>
        {combinedParameters.map((parameter, index) => (
          <li key={index} className="border-t last-of-type:border-b py-5 flex flex-col gap-3">
            <ParamOrTypeDetails paramOrType={parameter} />
          </li>
        ))}
      </ul>
    </div>
  )
}

interface SubContent {
  name: string
  isOptional?: boolean | 'NA' // not applicable
  type?: string
  description?: string
  subContent: Array<SubContent>
}

function ParamOrTypeDetails({ paramOrType }: { paramOrType: object }) {
  if (!('name' in paramOrType)) return

  const description: string =
    'description' in paramOrType
      ? (paramOrType.description as string)
      : isFromTypespec(paramOrType)
        ? paramOrType.comment?.shortText ?? ''
        : ''

  const subContent =
    'subContent' in paramOrType
      ? (paramOrType.subContent as Array<SubContent>)
      : isFromTypespec(paramOrType)
        ? getSubDetails(paramOrType)
        : undefined

  return (
    <>
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="font-mono text-sm font-medium text-foreground">
          {paramOrType.name === TYPESPEC_NODE_ANONYMOUS
            ? '[Anonymous]'
            : (paramOrType.name as string)}
        </span>
        <RequiredBadge
          isOptional={
            'isOptional' in paramOrType ? (paramOrType.isOptional as boolean | 'NA') : false
          }
        />
        {/* @ts-ignore */}
        {paramOrType?.comment?.tags?.some((tag) => tag.tag === 'deprecated') && (
          <span className="text-xs text-warning-600">Deprecated</span>
        )}
        <span className="text-xs text-foreground-muted">{getTypeName(paramOrType)}</span>
      </div>
      {description && (
        <div className="prose text-sm">
          <MDXRemoteBase source={normalizeMarkdown(description)} />
        </div>
      )}
      {subContent && subContent.length > 0 && <TypeSubDetails details={subContent} />}
    </>
  )
}

export function ReturnTypeDetails({ returnType }: { returnType: MethodTypes['ret'] }) {
  // These custom names that aren't defined aren't particularly meaningful, so
  // just don't display them.
  const isNameOnlyType = returnType.type.type === 'nameOnly'
  if (isNameOnlyType) return

  const subContent = getSubDetails(returnType)

  return (
    <div>
      <h3 className="mb-3 text-base text-foreground">Return Type</h3>
      <div className="border-t border-b py-5 flex flex-col gap-3">
        <div className="text-xs text-foreground-muted">{getTypeName(returnType)}</div>
        {returnType.comment?.shortText && (
          <div className="prose text-sm">
            <MDXRemoteBase source={normalizeMarkdown(returnType.comment?.shortText)} />
          </div>
        )}
        {subContent && subContent.length > 0 && <TypeSubDetails details={subContent} />}
      </div>
    </div>
  )
}

function TypeSubDetails({
  details,
  className,
}: {
  details: Array<SubContent> | Array<CustomTypePropertyType> | Array<TypeDetails>
  className?: string
}) {
  return (
    <Collapsible_Shadcn_>
      <CollapsibleTrigger_Shadcn_
        className={cn(
          'group',
          'w-fit rounded-full',
          'px-5 py-1',
          'border border-default',
          'flex items-center gap-2',
          'text-left text-sm text-foreground-light',
          'hover:bg-surface-100',
          'data-[state=open]:w-full',
          'data-[state=open]:rounded-b-none data-[state=open]:rounded-tl-lg data-[state=open]:rounded-tr-lg',
          'transition [transition-property:width,background-color]',
          className
        )}
      >
        <XCircle
          size={14}
          className={cn(
            'text-foreground-muted',
            'group-data-[state=closed]:rotate-45',
            'transition-transform'
          )}
        />
        Details
      </CollapsibleTrigger_Shadcn_>
      <CollapsibleContent_Shadcn_>
        <ul className={cn('border-b border-x border-default', 'rounded-b-lg')}>
          {details.map(
            (detail: SubContent | CustomTypePropertyType | TypeDetails, index: number) => (
              <li
                key={index}
                className={cn(
                  'px-5 py-3',
                  'border-t border-default first:border-t-0',
                  'flex flex-col gap-3'
                )}
              >
                <ParamOrTypeDetails paramOrType={detail} />
              </li>
            )
          )}
        </ul>
      </CollapsibleContent_Shadcn_>
    </Collapsible_Shadcn_>
  )
}

export function RequiredBadge({ isOptional }: { isOptional: boolean | 'NA' }) {
  return isOptional === true ? (
    <span className="font-mono text-[10px] text-foreground-lighter tracking-wide">Optional</span>
  ) : isOptional === false ? (
    <span
      className={cn(
        'inline-block',
        'px-2 py-0.25 rounded-full',
        '-translate-y-[0.125rem]', // retranslate to undo visual misalignment from the y-padding
        'border border-amber-700 bg-amber-300',
        'font-mono text-[10px] text-amber-900 uppercase tracking-wide'
      )}
    >
      Required
    </span>
  ) : undefined
}

export function ApiSchemaParamDetails({ param }: { param: IApiEndPoint['parameters'][number] }) {
  return (
    <li className="border-t last-of-type:border-b py-5 flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="font-mono text-sm font-medium text-foreground break-all">
          {param.name}
        </span>
        <RequiredBadge isOptional={!param.required} />
        {param.schema?.deprecated && <span className="text-xs text-warning-600">Deprecated</span>}
        {param.schema && (
          <span className="text-xs text-foreground-muted">
            {getTypeDisplayFromSchema(param.schema)?.displayName ?? ''}
          </span>
        )}
      </div>
      {param.description && (
        <ReactMarkdown className="prose break-words text-sm">{param.description}</ReactMarkdown>
      )}
      {param.schema && <ApiSchemaParamSubdetails schema={param.schema} />}
    </li>
  )
}

export function ApiOperationRequestBodyDetails({
  requestBody,
}: {
  requestBody: IApiEndPoint['requestBody']
}) {
  const availableSchemes = Object.keys(requestBody.content) as Array<
    'application/json' | 'application/x-www-form-urlencoded'
  >

  return (
    <>
      {availableSchemes.map((scheme, index) => (
        <ApiOperationRequestBodyDetailsInternal
          key={index}
          schema={requestBody.content[scheme].schema}
          hidden={index > 0}
          {...{
            [API_REFERENCE_REQUEST_BODY_SCHEMA_DATA_ATTRIBUTES.KEY]: scheme,
          }}
        />
      ))}
    </>
  )
}

interface ApiOperationRequestBodyDetailsInternalProps extends HTMLAttributes<HTMLUListElement> {
  schema: ISchema
}

function ApiOperationRequestBodyDetailsInternal({
  schema,
  ...props
}: ApiOperationRequestBodyDetailsInternalProps) {
  if ('allOf' in schema) {
    return (
      <>
        <span className="font-mono text-sm font-medium text-foreground">All of the following:</span>
        {schema.allOf.map((option, index) => (
          <ApiSchemaParamSubdetails key={index} schema={option} />
        ))}
      </>
    )
  } else if ('anyOf' in schema) {
    return (
      <>
        <span className="font-mono text-sm font-medium text-foreground">Any of the following:</span>
        {schema.anyOf.map((option, index) => (
          <ApiSchemaParamSubdetails key={index} schema={option} />
        ))}
      </>
    )
  } else if ('oneOf' in schema) {
    return (
      <>
        <span className="font-mono text-sm font-medium text-foreground">One of the following:</span>
        {schema.oneOf.map((option, index) => (
          <ApiSchemaParamSubdetails key={index} schema={option} />
        ))}
      </>
    )
  } else if ('enum' in schema) {
    return (
      <span className="font-mono text-sm font-medium text-foreground">
        {schema.enum.join(' | ')}
      </span>
    )
  } else if (
    schema.type === 'string' ||
    schema.type === 'boolean' ||
    schema.type === 'number' ||
    schema.type === 'integer'
  ) {
    return <span className="font-mono text-sm font-medium text-foreground">{schema.type}</span>
  } else if (schema.type === 'array') {
    return (
      <>
        <span className="font-mono text-sm font-medium text-foreground">{`Array of ${getTypeDisplayFromSchema(schema.items).displayName}`}</span>
        {!(
          'type' in schema.items &&
          ['string', 'boolean', 'number', 'integer'].includes(schema.items.type)
        ) && <ApiSchemaParamSubdetails className="mt-4" schema={schema.items} />}
      </>
    )
  } else if (schema.type === 'object') {
    return (
      <ul {...props}>
        {Object.keys(schema.properties)
          .map((property) => ({
            name: property,
            required: schema.required?.includes(property),
            in: 'body' as const,
            schema: schema.properties[property],
          }))
          .map((property, index) => (
            <ApiSchemaParamDetails key={index} param={property} />
          ))}
      </ul>
    )
  }
}

export function ApiSchemaParamSubdetails({
  schema,
  className,
}: {
  schema: ISchema
  className?: string
}) {
  if (
    !('enum' in schema) &&
    'type' in schema &&
    (['boolean', 'number', 'integer'].includes(schema.type) ||
      (schema.type === 'string' &&
        !('minLength' in schema || 'maxLength' in schema || 'pattern' in schema)) ||
      (schema.type === 'array' &&
        'type' in schema.items &&
        ['boolean', 'number', 'integer', 'string'].includes(schema.items.type)))
  ) {
    return null
  }

  const subContent =
    'enum' in schema
      ? schema.enum
      : 'anyOf' in schema
        ? schema.anyOf
        : 'oneOf' in schema
          ? schema.oneOf
          : 'allOf' in schema
            ? schema.allOf
            : 'type' in schema && schema.type === 'string'
              ? ['minLength', 'maxLength', 'pattern']
                  .filter((key) => key in schema)
                  .map((key) => ({
                    constraint: key,
                    value: schema[key],
                  }))
              : []

  return (
    <Collapsible_Shadcn_>
      <CollapsibleTrigger_Shadcn_
        className={cn(
          'group',
          'w-fit rounded-full',
          'px-5 py-1',
          'border border-default',
          'flex items-center gap-2',
          'text-left text-sm text-foreground-light',
          'hover:bg-surface-100',
          'data-[state=open]:w-full',
          'data-[state=open]:rounded-b-none data-[state=open]:rounded-tl-lg data-[state=open]:rounded-tr-lg',
          'transition [transition-property:width,background-color]',
          className
        )}
      >
        <XCircle
          size={14}
          className={cn(
            'text-foreground-muted',
            'group-data-[state=closed]:rotate-45',
            'transition-transform'
          )}
        />
        {'enum' in schema
          ? 'Accepted values'
          : 'allOf' in schema || 'anyOf' in schema || 'oneOf' in schema
            ? 'Options'
            : schema.type === 'array'
              ? 'Items'
              : schema.type === 'object'
                ? 'Object schema'
                : 'Details'}
      </CollapsibleTrigger_Shadcn_>
      <CollapsibleContent_Shadcn_>
        {'type' in schema && schema.type === 'object' ? (
          <div className={cn('border-b border-x border-fault', 'rounded-b-lg', 'p-5')}>
            <ApiSchema schema={schema} />
          </div>
        ) : (
          <ul className={cn('border-b border-x border-default', 'rounded-b-lg')}>
            {subContent.map((detail: any, index: number) => (
              <li
                key={index}
                className={cn(
                  'px-5 py-3',
                  'border-t border-default first:border-t-0',
                  'flex flex-col gap-3'
                )}
              >
                {'enum' in schema ? (
                  <span className="font-mono text-sm font-medium text-foreground">
                    {String(detail)}
                  </span>
                ) : 'type' in schema && schema.type === 'string' ? (
                  <span className="text-sm text-foreground flex items-baseline gap-2">
                    <span className="font-mono text-sm font-medium text-foreground">
                      {detail.constraint}
                    </span>
                    {detail.value}
                  </span>
                ) : 'anyOf' in schema || 'allOf' in schema || 'oneOf' in schema ? (
                  <ApiSchemaParamDetails
                    param={{ name: '', schema: detail, required: !detail.nullable, in: 'body' }}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CollapsibleContent_Shadcn_>
    </Collapsible_Shadcn_>
  )
}

/**
 * Whether the param comes from overwritten params in the library spec file or
 * directly from the type spec.
 *
 * We're cheating here, this isn't a full validation but rather just checking
 * that it isn't overwritten.
 */
function isFromTypespec(parameter: object): parameter is MethodTypes['params'][number] {
  return !('__overwritten' in parameter)
}

function getTypeName(parameter: object): string {
  if (!('type' in parameter)) return ''

  if (typeof parameter.type === 'string') {
    return parameter.type
  }

  if (typeof parameter.type !== 'object' || !('type' in parameter.type)) {
    return ''
  }

  const type = parameter.type

  switch (type.type) {
    case 'nameOnly':
      return nameOrDefault(type, '')
    case 'intrinsic':
      return nameOrDefault(type, '')
    case 'literal':
      return 'value' in type ? (type.value === null ? 'null' : `"${type.value as string}"`) : ''
    case 'record':
      // Needs an extra level of wrapping to fake the wrapping parameter
      // @ts-ignore
      return `Record<${getTypeName({ type: type.keyType })}, ${getTypeName({ type: type.valueType })}>`
    case 'object':
      return nameOrDefault(type, 'object')
    case 'function':
      return 'function'
    case 'promise':
      // Needs an extra level of wrapping to fake the wrapping parameter
      // @ts-ignore
      return `Promise<${getTypeName({ type: type.awaited })}>`
    case 'union':
      return 'Union: expand to see options'
    case 'index signature':
      // Needs an extra level of wrapping to fake the wrapping parameter
      // @ts-ignore
      return `{ [key: ${getTypeName({ type: type.keyType })}]: ${getTypeName({ type: type.valueType })} }`
    case 'array':
      // Needs an extra level of wrapping to fake the wrapping parameter
      // @ts-ignore
      return `Array<${getTypeName({ type: type.elemType })}>`
  }

  return ''
}

function nameOrDefault(node: object, fallback: string) {
  return 'name' in node && node.name !== TYPESPEC_NODE_ANONYMOUS ? (node.name as string) : fallback
}

function getSubDetails(parentType: MethodTypes['params'][number] | MethodTypes['ret']) {
  let subDetails: Array<any>

  switch (parentType.type?.type) {
    case 'object':
      subDetails = parentType.type.properties
      break
    case 'function':
      subDetails = [
        ...(parentType.type.params.length === 0
          ? []
          : [
              {
                name: 'Parameters',
                type: 'callback parameters',
                isOptional: 'NA',
                params: parentType.type.params.map((param) => ({
                  ...param,
                  isOptional: 'NA',
                })),
              },
            ]),
        { name: 'Return', type: parentType.type.ret.type, isOptional: 'NA' },
      ]
      break
    // @ts-ignore -- Adding these fake types to take advantage of existing recursion
    case 'callback parameters':
      // @ts-ignore -- Adding these fake types to take advantage of existing recursion
      subDetails = parentType.params
      break
    case 'union':
      subDetails = parentType.type.subTypes.map((subType, index) => ({
        name: `union option ${index + 1}`,
        type: { ...subType },
        isOptional: 'NA',
      }))
      break
    case 'promise':
      if (parentType.type.awaited.type === 'union') {
        subDetails = parentType.type.awaited.subTypes.map((subType, index) => ({
          name: `union option ${index + 1}`,
          type: { ...subType },
          isOptional: 'NA',
        }))
      } else if (parentType.type.awaited.type === 'object') {
        subDetails = parentType.type.awaited.properties.map((property) => ({
          ...property,
          isOptional: 'NA',
        }))
      } else if (parentType.type.awaited.type === 'array') {
        subDetails = [
          { name: 'array element', type: parentType.type.awaited.elemType, isOptional: 'NA' },
        ]
      }
      break
    case 'array':
      if (parentType.type.elemType.type === 'union') {
        subDetails = parentType.type.elemType.subTypes.map((subType, index) => ({
          name: `union option ${index + 1}`,
          type: { ...subType },
          isOptional: 'NA',
        }))
      }
      if (parentType.type.elemType.type === 'object') {
        subDetails = parentType.type.elemType.properties
      }
      break
  }

  subDetails?.sort((a, b) => (a.isOptional === true ? 1 : 0) - (b.isOptional === true ? 1 : 0))

  return subDetails
}

function mergeAlternateParameters(
  parameters: Array<object>,
  altParameters: Array<Array<FunctionParameterType>>
) {
  const combinedParameters = parameters.map((parameter) => {
    if (!isFromTypespec(parameter)) return parameter

    const parameterWithoutType = { ...parameter }
    if ('type' in parameterWithoutType) {
      delete parameterWithoutType.type
    }

    for (const alternate of altParameters) {
      const match = alternate.find((alternateParam) => {
        const alternateWithoutType = { ...alternateParam }
        if ('type' in alternateWithoutType) {
          delete alternateWithoutType.type
        }

        return isEqual(parameterWithoutType, alternateWithoutType)
      })

      if (match) {
        // @ts-ignore
        parameter = applyParameterMergeStrategy(parameter, match)
      }
    }

    return parameter
  })

  return combinedParameters
}

function applyParameterMergeStrategy(
  parameter: Pick<FunctionParameterType, 'type'>,
  alternateParameter: Pick<FunctionParameterType, 'type'>
) {
  if (!alternateParameter.type) {
    // Nothing to merge, abort
    return parameter as FunctionParameterType
  }

  const clonedParameter = JSON.parse(JSON.stringify(parameter)) as FunctionParameterType

  if (!clonedParameter.type) {
    clonedParameter.type = alternateParameter.type
    return clonedParameter
  }

  switch (clonedParameter.type.type) {
    case 'nameOnly':
      mergeIntoUnion()
      break
    case 'literal':
      mergeIntoUnion()
      break
    case 'record':
      mergeIntoUnion()
      break
    case 'union':
      if (alternateParameter.type.type === 'union') {
        // Both unions, merge them
        for (const alternateSubType of alternateParameter.type.subTypes) {
          if (
            !clonedParameter.type.subTypes.some((subType) => isEqual(subType, alternateSubType))
          ) {
            clonedParameter.type.subTypes.push(alternateSubType)
          }
        }
      } else {
        if (
          !clonedParameter.type.subTypes.some((subType) =>
            isEqual(subType, alternateParameter.type)
          )
        ) {
          clonedParameter.type.subTypes.push(alternateParameter.type)
        }
      }
      break
    case 'object':
      if (alternateParameter.type.type === 'object') {
        // Check if the base and alternate parameters have different sets of
        // required properties. If so, they can't be merged without loss of
        // meaning and have to be represented as a union.
        const requiredOriginalProperties = new Set(
          clonedParameter.type.properties.filter(
            // @ts-ignore -- NA introduced as an additional flag for display logic
            (property) => property.isOptional !== true && property.isOptional !== 'NA'
          )
        )
        const requiredAlternateProperties = new Set(
          alternateParameter.type.properties.filter(
            // @ts-ignore -- NA introduced as an additional flag for display logic
            (property) => property.isOptional !== true && property.isOptional !== 'NA'
          )
        )
        if (requiredOriginalProperties.size !== requiredAlternateProperties.size) {
          mergeIntoUnion()
          break
        }
        const union = new Set([...requiredOriginalProperties, ...requiredAlternateProperties])
        if (union.size !== requiredOriginalProperties.size) {
          mergeIntoUnion()
          break
        }

        const clonedParametersByName = new Map(
          clonedParameter.type.properties.map((property) => [property.name, property])
        )
        const alternateParametersByName = new Map(
          alternateParameter.type.properties.map((property) => [property.name, property])
        )

        for (const [key, alternateValue] of alternateParametersByName) {
          if (clonedParametersByName.has(key)) {
            clonedParametersByName.set(
              key,
              applyParameterMergeStrategy(clonedParametersByName.get(key), alternateValue)
            )
          } else {
            clonedParametersByName.set(key, alternateValue)
          }
        }

        clonedParameter.type.properties = [...clonedParametersByName.values()]
      } else {
        mergeIntoUnion()
      }
  }

  return clonedParameter as FunctionParameterType

  /*********
   * Utils *
   *********/

  function mergeIntoUnion() {
    if (alternateParameter.type.type === 'union') {
      const originalType = clonedParameter.type

      if (
        alternateParameter.type.subTypes.some((subType) => isEqual(subType, clonedParameter.type))
      ) {
        clonedParameter.type = alternateParameter.type
      } else {
        clonedParameter.type = {
          type: 'union',
          subTypes: [originalType, ...alternateParameter.type.subTypes],
        }
      }
    } else {
      const originalType = parameter.type
      if (!isEqual(originalType, alternateParameter.type)) {
        clonedParameter.type = {
          type: 'union',
          subTypes: [originalType, alternateParameter.type],
        }
      }
    }
  }
}
