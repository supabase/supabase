import { createHash } from 'crypto'
import { readFile } from 'fs/promises'
import yaml from 'js-yaml'
import type { OpenAPIV3 } from 'openapi-types'
import type {
  ICommonItem,
  ICommonSection,
  IFunctionDefinition,
  ISpec,
} from '../../../components/reference/Reference.types.js'
import { getApiEndpointById } from '../../../features/docs/Reference.generated.singleton.js'
import type { CliCommand, CliSpec } from '../../../generator/types/CliSpec.js'
import { flattenSections } from '../../../lib/helpers.js'
import { enrichedOperation, gen_v3 } from '../../../lib/refGenerator/helpers.js'
import { BaseLoader, BaseSource } from './base.js'

export abstract class ReferenceLoader<SpecSection> extends BaseLoader {
  type = 'reference' as const
  sourceConstructor: (
    ...args: ConstructorParameters<typeof ReferenceSource<SpecSection>>
  ) => ReferenceSource<SpecSection>

  constructor(
    source: string,
    path: string,
    public meta: Record<string, unknown>,
    public specFilePath: string,
    public sectionsFilePath: string
  ) {
    super(source, path)
  }

  async load(): Promise<BaseSource[]> {
    const specContents = await readFile(this.specFilePath, 'utf8')
    const refSectionsContents = await readFile(this.sectionsFilePath, 'utf8')

    const refSections: ICommonItem[] = JSON.parse(refSectionsContents)
    const flattenedRefSections = flattenSections(refSections)

    const specSections = this.getSpecSections(specContents)

    const sections = (
      await Promise.all(
        flattenedRefSections.map(async (refSection) => {
          const specSection = await this.matchSpecSection(specSections, refSection.id)

          if (!specSection) {
            return
          }

          return this.sourceConstructor(
            this.source,
            `${this.path}/${refSection.slug}`,
            refSection,
            specSection,
            this.enhanceMeta(specSection)
          )
        })
      )
    ).filter((item): item is ReferenceSource<SpecSection> => item !== undefined)

    return sections as BaseSource[]
  }

  abstract getSpecSections(specContents: string): SpecSection[]
  abstract matchSpecSection(
    specSections: SpecSection[],
    id: string
  ): SpecSection | undefined | Promise<SpecSection | undefined>
  enhanceMeta(_section: SpecSection): Record<string, unknown> {
    return this.meta
  }
}

export abstract class ReferenceSource<SpecSection> extends BaseSource {
  type = 'reference' as const

  constructor(
    source: string,
    path: string,
    public refSection: ICommonSection,
    public specSection: SpecSection,
    public meta: Record<string, unknown>
  ) {
    super(source, path)
  }

  async process() {
    const checksum = createHash('sha256')
      .update(JSON.stringify(this.refSection) + JSON.stringify(this.specSection))
      .digest('base64')

    const sections = [
      {
        heading: this.refSection.title,
        slug: this.refSection.slug,
        content: `${this.meta.title} for ${this.refSection.title}:\n${this.formatSection(
          this.specSection,
          this.refSection
        )}`,
      },
    ]

    this.checksum = checksum
    this.sections = sections

    return {
      checksum,
      sections,
      meta: {
        ...this.meta,
        subtitle: this.extractSubtitle(),
        title: this.extractTitle(),
      },
    }
  }

  abstract formatSection(specSection: SpecSection, refSection: ICommonItem): string
  abstract extractTitle(): string
  abstract extractSubtitle(): string
}

export class OpenApiReferenceLoader extends ReferenceLoader<Partial<enrichedOperation>> {
  constructor(
    source: string,
    path: string,
    meta: Record<string, unknown>,
    specFilePath: string,
    sectionsFilePath: string
  ) {
    super(source, path, meta, specFilePath, sectionsFilePath)
    this.sourceConstructor = (...args) => new OpenApiReferenceSource(...args)
  }

  getSpecSections(specContents: string): enrichedOperation[] {
    const spec: OpenAPIV3.Document<{}> = JSON.parse(specContents)

    const generatedSpec = gen_v3(spec, '', {
      apiUrl: 'apiv0',
    })

    return generatedSpec.operations
  }
  async matchSpecSection(
    _operations: enrichedOperation[],
    id: string
  ): Promise<Partial<enrichedOperation> | undefined> {
    const apiEndpoint = await getApiEndpointById(id)
    if (!apiEndpoint) return undefined

    const enrichedOp: Partial<enrichedOperation> = {
      operationId: apiEndpoint.id,
      operation: apiEndpoint.method,
      path: apiEndpoint.path,
      summary: apiEndpoint.summary,
      description: apiEndpoint.description,
      deprecated: apiEndpoint.deprecated,
      parameters: apiEndpoint.parameters as any,
      requestBody: apiEndpoint.requestBody as any,
      responses: apiEndpoint.responses as any,
    }

    return enrichedOp
  }
}

export class OpenApiReferenceSource extends ReferenceSource<Partial<enrichedOperation>> {
  formatSection(specOperation: enrichedOperation, _: ICommonItem) {
    const { summary, description, operation, path, tags, parameters, responses, operationId } =
      specOperation
    return JSON.stringify({
      summary,
      description,
      operation,
      path,
      tags,
      parameters,
      responses,
      operationId,
    })
  }

  extractSubtitle() {
    return `${this.meta.title}: ${this.specSection.description || this.specSection.operationId || ''}`
  }

  extractTitle() {
    return (
      this.specSection.summary ||
      (typeof this.meta.title === 'string' ? this.meta.title : this.specSection.operation) ||
      ''
    )
  }

  extractIndexedContent(): string {
    const { summary, description, operation, tags, path, parameters, responses } = this.specSection

    const sections: string[] = []

    // Title
    sections.push(`# ${this.meta.title ?? ''}`)

    // Summary
    if (summary) {
      sections.push(summary)
    }

    // Description
    if (description) {
      sections.push(`Description: ${description}`)
    }

    // Path and Method
    if (path) {
      sections.push(`Path: ${operation?.toUpperCase() || 'GET'} ${path}`)
    }

    // Parameters
    if (parameters && parameters.length > 0) {
      const paramList = parameters
        .map((param: any) => {
          const required = param.required ? 'required' : 'optional'
          return `- ${param.name} (${param.schema?.type || 'string'}, ${required}): ${param.description || ''}`
        })
        .join('\n')
      sections.push(`Parameters:\n${paramList}`)
    }

    // Response Types
    if (responses) {
      const responseList = Object.entries(responses)
        .map(([code, response]: [string, any]) => {
          const desc = response.description || 'No description'
          return `- ${code}: ${desc}`
        })
        .join('\n')
      sections.push(`Responses:\n${responseList}`)
    }

    // Tags
    if (tags && tags.length > 0) {
      sections.push(`Tags: ${tags.join(', ')}`)
    }

    return sections.filter(Boolean).join('\n\n')
  }
}

export class ClientLibReferenceLoader extends ReferenceLoader<IFunctionDefinition> {
  constructor(
    source: string,
    path: string,
    meta: Record<string, unknown>,
    specFilePath: string,
    sectionsFilePath: string
  ) {
    super(source, path, meta, specFilePath, sectionsFilePath)
    this.sourceConstructor = (...args) => new ClientLibReferenceSource(...args)
  }

  getSpecSections(specContents: string): IFunctionDefinition[] {
    const spec = yaml.load(specContents) as ISpec

    return spec.functions
  }

  matchSpecSection(
    functionDefinitions: IFunctionDefinition[],
    id: string
  ): IFunctionDefinition | undefined {
    return functionDefinitions.find((functionDefinition) => functionDefinition.id === id)
  }

  enhanceMeta(section: IFunctionDefinition): Record<string, unknown> {
    return { ...this.meta, slug: section.id, methodName: section.title }
  }
}

export class ClientLibReferenceSource extends ReferenceSource<IFunctionDefinition> {
  formatSection(functionDefinition: IFunctionDefinition, refSection: ICommonItem): string {
    const { title } = refSection
    const { description, title: functionName } = functionDefinition

    return JSON.stringify({
      title,
      description,
      functionName,
    })
  }

  extractTitle(): string {
    return this.specSection.title
  }

  extractSubtitle(): string {
    return `${this.meta.title}: ${this.refSection.title}`
  }

  extractIndexedContent(): string {
    const { title, description, examples } = this.specSection
    const exampleText =
      examples
        ?.map((example) => `### ${example.name ?? ''}\n\n${example.code ?? ''}`)
        .join('\n\n') ?? ''
    return `# ${this.meta.title ?? ''}\n\n${title ?? ''}\n\n${description ?? ''}\n\n## Examples\n\n${exampleText}`
  }
}

export class CliReferenceLoader extends ReferenceLoader<CliCommand> {
  constructor(
    source: string,
    path: string,
    meta: Record<string, unknown>,
    specFilePath: string,
    sectionsFilePath: string
  ) {
    super(source, path, meta, specFilePath, sectionsFilePath)
    this.sourceConstructor = (...args) => new CliReferenceSource(...args)
  }

  getSpecSections(specContents: string): CliCommand[] {
    const spec = yaml.load(specContents) as CliSpec

    return spec.commands
  }
  matchSpecSection(cliCommands: CliCommand[], id: string): CliCommand | undefined {
    return cliCommands.find((cliCommand) => cliCommand.id === id)
  }
}

export class CliReferenceSource extends ReferenceSource<CliCommand> {
  formatSection(cliCommand: CliCommand, _: ICommonItem): string {
    const { summary, description, usage } = cliCommand
    return JSON.stringify({
      summary,
      description,
      usage,
    })
  }

  extractSubtitle(): string {
    return `${this.meta.title}: ${this.specSection.title}`
  }

  extractTitle(): string {
    return this.specSection.summary
  }

  extractIndexedContent(): string {
    const { summary, description, usage } = this.specSection
    return `# ${this.meta.title ?? ''}\n\n${summary ?? ''}\n\n${description ?? ''}\n\n${usage ?? ''}`
  }
}
