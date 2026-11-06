/**
 * Taken from the [graphql-fields](https://github.com/robrichard/graphql-fields)
 * package, available under the MIT license.
 *
 * See [original license](https://github.com/robrichard/graphql-fields/blob/3446ddf36df03fb8f906596c039988cc2faf94a8/LICENSE).
 *
 * Reproduced here to avoid taking on another dependency for a relatively short
 * piece of code.
 */

import {
  type DirectiveNode,
  type FieldNode,
  type FragmentDefinitionNode,
  type FragmentSpreadNode,
  type GraphQLResolveInfo,
  type InlineFragmentNode,
  type SelectionNode,
  type ValueNode,
} from 'graphql'

let options = { processArguments: false, excludedFields: [] as string[] }

function getSelections(ast: FieldNode | FragmentDefinitionNode | InlineFragmentNode) {
  if (
    ast &&
    ast.selectionSet &&
    ast.selectionSet.selections &&
    ast.selectionSet.selections.length
  ) {
    return ast.selectionSet.selections
  }

  return []
}

function isFragment(ast: SelectionNode): ast is FragmentSpreadNode | InlineFragmentNode {
  return ast.kind === 'InlineFragment' || ast.kind === 'FragmentSpread'
}

function getAST(ast: FragmentSpreadNode | InlineFragmentNode, info: GraphQLResolveInfo) {
  if (ast.kind === 'FragmentSpread') {
    const fragmentName = ast.name.value
    return info.fragments[fragmentName]
  }
  return ast
}

function getArguments(ast: FieldNode, info: GraphQLResolveInfo) {
  return ast.arguments?.map((argument) => {
    const argumentValue = getArgumentValue(argument.value, info)

    return {
      [argument.name.value]: {
        kind: argument.value.kind,
        value: argumentValue,
      },
    }
  })
}

function getArgumentValue(arg: ValueNode, info: GraphQLResolveInfo) {
  switch (arg.kind) {
    case 'FloatValue':
      return parseFloat(arg.value)
    case 'IntValue':
      return parseInt(arg.value, 10)
    case 'Variable':
      return info.variableValues[arg.name.value]
    case 'ListValue':
      return arg.values.map((argument) => getArgumentValue(argument, info))
    case 'ObjectValue':
      return arg.fields.reduce((argValue, objectField) => {
        argValue[objectField.name.value] = getArgumentValue(objectField.value, info)
        return argValue
      }, {})
    default:
      // @ts-ignore
      return arg.value
  }
}

function getDirectiveValue(directive: DirectiveNode, info: GraphQLResolveInfo) {
  const arg = directive.arguments?.[0]
  if (!arg) return undefined
  if (arg.value.kind !== 'Variable') {
    return arg.value.kind === 'BooleanValue' ? arg.value.value : undefined
  }
  return info.variableValues[arg.value.name.value]
}

function getDirectiveResults(ast: SelectionNode, info: GraphQLResolveInfo) {
  const directiveResult = {
    shouldInclude: true,
    shouldSkip: false,
  }
  return (
    ast.directives?.reduce((result, directive) => {
      switch (directive.name.value) {
        case 'include':
          const directiveValue = getDirectiveValue(directive, info)
          if (directiveValue != undefined) {
            return { ...result, shouldInclude: directiveValue }
          }
          return result
        case 'skip':
          const directiveSkipValue = getDirectiveValue(directive, info)
          if (directiveSkipValue != undefined) {
            return { ...result, shouldSkip: directiveSkipValue }
          }
          return result
        default:
          return result
      }
    }, directiveResult) ?? directiveResult
  )
}

function flattenAST(
  ast: FieldNode | FragmentDefinitionNode | InlineFragmentNode,
  info: GraphQLResolveInfo,
  obj?: Record<string, any>
) {
  obj = obj || {}
  return getSelections(ast).reduce((flattened, a) => {
    if (a.directives && a.directives.length) {
      const { shouldInclude, shouldSkip } = getDirectiveResults(a, info)
      if (shouldSkip || !shouldInclude) {
        return flattened
      }
    }
    if (isFragment(a)) {
      flattened = flattenAST(getAST(a, info), info, flattened)
    } else {
      const name = a.name.value
      if (options.excludedFields && options.excludedFields.indexOf(name) !== -1) {
        return flattened
      }
      if (flattened[name] && flattened[name] !== '__arguments') {
        Object.assign(flattened[name], flattenAST(a, info, flattened[name]))
      } else {
        flattened[name] = flattenAST(a, info)
      }
      if (options.processArguments) {
        // check if the current field has arguments
        if (a.arguments && a.arguments.length) {
          Object.assign(flattened[name], { __arguments: getArguments(a, info) })
        }
      }
    }

    return flattened
  }, obj)
}

export function graphQLFields(
  info: GraphQLResolveInfo,
  obj = {},
  opts = { processArguments: false }
): Record<string, any> {
  const fields = info.fieldNodes
  options.processArguments = opts.processArguments
  return fields.reduce((o, ast) => {
    return flattenAST(ast, info, o)
  }, obj)
}
