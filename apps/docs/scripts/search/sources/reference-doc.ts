import { createHash } from 'crypto'
import { readFile } from 'fs/promises'
import yaml from 'js-yaml'
import { OpenAPIV3 } from 'openapi-types'
import {
  ICommonItem,
  IFunctionDefinition,
  ISpec,
} from '../../../components/reference/Reference.types'
import { CliCommand, CliSpec } from '../../../generator/types/CliSpec'
import { flattenSections } from '../../../lib/helpers'
import { enrichedOperation, gen_v3 } from '../../../lib/refGenerator/helpers'
import { BaseSource, Json } from './base'

export abstract class ReferenceSource<SpecSection> extends BaseSource {
  type = 'reference' as const

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

    const checksum = createHash('sha256')
      .update(specContents + refSectionsContents)
      .digest('base64')

    const specSections = this.getSpecSections(specContents)

    const sections = flattenedRefSections
      .map((refSection) => {
        const specSection = this.matchSpecSection(specSections, refSection.id)

        if (!specSection) {
          return
        }

        return {
          heading: refSection.title,
          slug: refSection.slug,
          content: `${this.meta.title} for ${refSection.title}:\n${this.formatSection(
            specSection,
            refSection
          )}`,
        }
      })
      .filter((section) => !!section)

    this.checksum = checksum
    this.sections = sections

    return {
      checksum,
      sections,
      meta: this.meta,
    }
  }

  abstract getSpecSections(specContents: string): SpecSection[]
  abstract matchSpecSection(specSections: SpecSection[], id: string): SpecSection
  abstract formatSection(specSection: SpecSection, refSection: ICommonItem): string
}

export class OpenApiReferenceSource extends ReferenceSource<enrichedOperation> {
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
  formatSection(specOperation: enrichedOperation) {
    const { summary, description, operation, path, tags } = specOperation
    return JSON.stringify({
      summary,
      description,
      operation,
      path,
      tags,
    })
  }
}

export class ClientLibReferenceSource extends ReferenceSource<IFunctionDefinition> {
  getSpecSections(specContents: string): IFunctionDefinition[] {
    const spec = yaml.load(specContents) as ISpec

    return spec.functions
  }
  matchSpecSection(functionDefinitions: IFunctionDefinition[], id: string): IFunctionDefinition {
    return functionDefinitions.find((functionDefinition) => functionDefinition.id === id)
  }
  formatSection(functionDefinition: IFunctionDefinition, refSection: ICommonItem): string {
    const { title } = refSection
    const { description, title: functionName } = functionDefinition

    return JSON.stringify({
      title,
      description,
      functionName,
    })
  }
}

export class CliReferenceSource extends ReferenceSource<CliCommand> {
  getSpecSections(specContents: string): CliCommand[] {
    const spec = yaml.load(specContents) as CliSpec

    return spec.commands
  }
  matchSpecSection(cliCommands: CliCommand[], id: string): CliCommand {
    return cliCommands.find((cliCommand) => cliCommand.id === id)
  }
  formatSection(cliCommand: CliCommand): string {
    const { summary, description, usage } = cliCommand
    return JSON.stringify({
      summary,
      description,
      usage,
    })
  }
}
