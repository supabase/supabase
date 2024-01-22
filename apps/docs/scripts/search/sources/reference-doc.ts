import { createHash } from 'crypto'
import { readFile } from 'fs/promises'
import yaml from 'js-yaml'
import { OpenAPIV3 } from 'openapi-types'
import {
  ICommonItem,
  ICommonSection,
  IFunctionDefinition,
  ISpec,
} from '../../../components/reference/Reference.types'
import { CliCommand, CliSpec } from '../../../generator/types/CliSpec'
import { flattenSections } from '../../../lib/helpers'
import { enrichedOperation, gen_v3 } from '../../../lib/refGenerator/helpers'
import { BaseLoader, BaseSource, Json } from './base'

export abstract class ReferenceLoader<SpecSection> extends BaseLoader {
  type = 'reference' as const
  sourceConstructor: (
    ...args: ConstructorParameters<typeof ReferenceSource<SpecSection>>
  ) => ReferenceSource<SpecSection>

  constructor(
    source: string,
    path: string,
    public meta: Json,
    public specFilePath: string,
    public sectionsFilePath: string
  ) {
    super(source, path)
  }

  async load() {
    const specContents = await readFile(this.specFilePath, 'utf8')
    const refSectionsContents = await readFile(this.sectionsFilePath, 'utf8')

    const refSections: ICommonItem[] = JSON.parse(refSectionsContents)
    const flattenedRefSections = flattenSections(refSections)

    const specSections = this.getSpecSections(specContents)

    const sections = flattenedRefSections
      .map((refSection) => {
        const specSection = this.matchSpecSection(specSections, refSection.id)

        if (!specSection) {
          return
        }

        return this.sourceConstructor(
          this.source,
          `${this.path}/${refSection.slug}`,
          refSection,
          specSection,
          this.meta
        )
      })
      .filter(Boolean)

    return sections
  }

  abstract getSpecSections(specContents: string): SpecSection[]
  abstract matchSpecSection(specSections: SpecSection[], id: string): SpecSection
}

export abstract class ReferenceSource<SpecSection> extends BaseSource {
  type = 'reference' as const

  constructor(
    source: string,
    path: string,
    public refSection: ICommonSection,
    public specSection: SpecSection,
    public meta: Json
  ) {
    super(source, path)
  }

  process() {
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

export class OpenApiReferenceLoader extends ReferenceLoader<enrichedOperation> {
  constructor(
    source: string,
    path: string,
    meta: Json,
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
  matchSpecSection(operations: enrichedOperation[], id: string): enrichedOperation {
    return operations.find((operation) => operation.operationId === id)
  }
}

export class OpenApiReferenceSource extends ReferenceSource<enrichedOperation> {
  formatSection(specOperation: enrichedOperation, _: ICommonItem) {
    const { summary, description, operation, path, tags } = specOperation
    return JSON.stringify({
      summary,
      description,
      operation,
      path,
      tags,
    })
  }

  extractSubtitle() {
    return `${this.meta.title}: ${this.specSection.description}`
  }

  extractTitle() {
    return (
      this.specSection.summary ||
      (typeof this.meta.title === 'string' ? this.meta.title : this.specSection.operation)
    )
  }

  extractIndexedContent(): string {
    const { summary, description, operation, tags } = this.specSection
    return `${this.meta.title}\n\n${summary}\n\n${description}\n\n${operation}\n\n${tags.join(
      ', '
    )}`
  }
}

export class ClientLibReferenceLoader extends ReferenceLoader<IFunctionDefinition> {
  constructor(
    source: string,
    path: string,
    meta: Json,
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
  matchSpecSection(functionDefinitions: IFunctionDefinition[], id: string): IFunctionDefinition {
    return functionDefinitions.find((functionDefinition) => functionDefinition.id === id)
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
    const { title, description } = this.specSection
    return `${this.meta.title}\n\n${title}\n\n${description}`
  }
}

export class CliReferenceLoader extends ReferenceLoader<CliCommand> {
  constructor(
    source: string,
    path: string,
    meta: Json,
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
  matchSpecSection(cliCommands: CliCommand[], id: string): CliCommand {
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
    return `${this.meta.title}\n\n${summary}\n\n${description}\n\n${usage}`
  }
}
