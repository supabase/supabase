import { isEqual } from 'lodash'
import { XCircle } from 'lucide-react'
import type { PropsWithChildren } from 'react'

import { Collapsible_Shadcn_, CollapsibleContent_Shadcn_, CollapsibleTrigger_Shadcn_, cn } from 'ui'

import { MDXRemoteBase } from '~/features/docs/MdxBase'
import type {
  CustomTypePropertyType,
  CustomUnionType,
  FunctionParameterType,
  MethodTypes,
  TypeDetails,
} from '~/features/docs/Reference.typeSpec'
import { TYPESPEC_NODE_ANONYMOUS } from '~/features/docs/Reference.typeSpec'
import { normalizeMarkdown } from '~/features/docs/Reference.utils'

type SectionProps = PropsWithChildren & {
  id: string
  columns?: 'single' | 'double'
}

function Section({ id, columns = 'single', children }: SectionProps) {
  const singleColumn = columns === 'single'

  return (
    <section>
      <div
        className={cn(
          'grid grid-cols-[1fr] gap-x-16 gap-y-8',
          singleColumn ? 'max-w-3xl' : '@4xl/article:grid-cols-[1fr,1fr]'
        )}
      >
        {children}
      </div>
    </section>
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
  return <div className="w-full min-w-full sticky top-32">{children}</div>
}

function EducationSection({ children, ...props }: PropsWithChildren) {
  return <section className={'prose max-w-none'}>{children}</section>
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
        ? paramOrType.type?.type === 'object'
          ? paramOrType.type.properties
          : paramOrType.type?.type === 'function'
            ? [
                ...(paramOrType.type.params.length === 0
                  ? []
                  : [
                      {
                        name: 'Parameters',
                        type: 'callback parameters',
                        isOptional: 'NA',
                        params: paramOrType.type.params.map((param) => ({
                          ...param,
                          isOptional: 'NA',
                        })),
                      },
                    ]),
                { name: 'Return', type: paramOrType.type.ret.type, isOptional: 'NA' },
              ]
            : // @ts-ignore -- Faking these to take advantage of recursion
              paramOrType.type === 'callback parameters'
              ? // @ts-ignore -- Faking these to take advantage of recursion
                paramOrType.params
              : paramOrType.type?.type === 'union'
                ? paramOrType.type.subTypes.map((subType, index) => ({
                    name: `union option ${index + 1}`,
                    type: { ...subType },
                    isOptional: 'NA',
                  }))
                : undefined
        : undefined
  subContent?.sort((a, b) => (a.isOptional === true ? 1 : 0) - (b.isOptional === true ? 1 : 0))

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

function RequiredBadge({ isOptional }: { isOptional: boolean | 'NA' }) {
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
