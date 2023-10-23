/* eslint-disable @typescript-eslint/ban-types */
import { AllureReporterApi, jasmine_, registerAllureReporter } from 'jest-allure2-adapter'
import { ContentType, Severity } from 'allure-js-commons'

// eslint-disable-next-line @typescript-eslint/ban-types
type TestDecorator = (
  target: object,
  property: string,
  descriptor: PropertyDescriptor
) => PropertyDescriptor
export class JasmineAllureReporter implements jasmine_.CustomReporter {
  allure: AllureReporterApi

  constructor(allure: AllureReporterApi) {
    this.allure = allure
  }

  suiteStarted(suite?: jasmine_.CustomReporterResult): void {
    this.allure.startGroup(suite.description)
    // some actions here on suite started
  }

  suiteDone(): void {
    // some actions here on suite end
    this.allure.endGroup()
  }

  specStarted(spec: jasmine_.CustomReporterResult): void {
    this.allure.startTest(spec)
    // some actions here on test started
  }

  specDone(spec: jasmine_.CustomReporterResult): void {
    // some actions here on spec end
    this.allure.endTest(spec)
  }
}

registerAllureReporter(undefined, (allure) => new JasmineAllureReporter(allure))

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      reporter: AllureReporterApi
    }
  }
}

function getAllure(): AllureReporterApi {
  // @ts-ignore - we are checking if reporter is defined
  if (!global.reporter) {
    throw new Error('Unable to find Allure implementation')
  }
  // @ts-ignore - we know that reporter is an AllureReporterApi
  return global.reporter
}

export function step<T>(nameFn: string | ((arg: T) => string)): TestDecorator {
  return (target: object, propertyKey: string, descriptor: PropertyDescriptor) => {
    const original: object = descriptor.value
    let callable: (args: T) => void = () => {
      /* */
    }

    if (typeof original === 'function') {
      descriptor.value = function (...args: [T]) {
        try {
          const value: string = typeof nameFn === 'function' ? nameFn.apply(this, args) : nameFn
          callable = () => getAllure().step(value, () => original.apply(this, args))
          // tslint:disable-next-line:no-console
          console.info(`Step: ${value || nameFn}`)
        } catch (e) {
          // tslint:disable-next-line:no-console
          console.error(`[ERROR] Failed to apply decorator: ${e}`)
        }
        return callable.apply(this, args)
      }
    }
    return descriptor
  }
}

export function attachment<T>(name: string, type: ContentType) {
  return (
    _target: object,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor => {
    const original: object = descriptor.value
    let callable: (args: T) => void = () => {
      /* */
    }

    if (typeof original === 'function') {
      descriptor.value = async function (...args: [T]) {
        try {
          const content: Buffer | string = await original.apply(this, args)
          callable = () =>
            getAllure().step(name, () => {
              getAllure().attachment(type.toString(), content, type)
            })
        } catch (e) {
          // tslint:disable-next-line:no-console
          console.error(`[ERROR] Failed to apply decorator: ${e}`)
        }
        return callable.apply(this, args)
      }
    }
    return descriptor
  }
}

export function attach(name: string, content: string | Buffer, type: ContentType): void {
  getAllure().step(name, () => {
    getAllure().attachment(type.toString(), content, type)
  })
}

export function log(name: string, description?: string): void {
  console.info(description ? `${name}: ${description}` : name)
  getAllure().step(name, () => {
    if (description) {
      getAllure().step(description, () => {
        /* */
      })
    }
  })
}

export function feature<T>(featureFn: string | ((arg: T) => string)): TestDecorator {
  return processDecorator(featureFn, (name) => getAllure().feature(name))
}

export function story<T>(storyFn: string | ((arg: T) => string)): TestDecorator {
  return processDecorator(storyFn, (name) => getAllure().story(name))
}

export function severity<T>(
  severityFn: Severity | string | ((arg: T) => string | Severity)
): TestDecorator {
  return processDecorator(severityFn, (name: Severity) => getAllure().severity(name))
}

export function tag<T>(tagFn: string | ((arg: T) => string)): TestDecorator {
  return processDecorator(tagFn, (name) => getAllure().tag(name))
}

export function owner<T>(ownerFn: string | ((arg: T) => string)): TestDecorator {
  return processDecorator(ownerFn, (name) => getAllure().owner(name))
}

export function description<T>(descriptionFn: string | ((arg: T) => string)): TestDecorator {
  return processDecorator(descriptionFn, (text) => getAllure().description(text))
}

function processDecorator<T>(
  parameterFn: string | ((arg: T) => string),
  reporterFn: (arg: string) => void
): TestDecorator {
  return (target: object, property: string, descriptor: PropertyDescriptor) => {
    return processDescriptor(parameterFn, reporterFn, descriptor)
  }
}

function processDescriptor<T>(
  parameterFn: string | ((arg: T) => string),
  reporterFn: (arg: string) => void,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const original: object = descriptor.value
  if (typeof original === 'function') {
    descriptor.value = function (...args: [T]) {
      try {
        const value: string =
          typeof parameterFn === 'function' ? parameterFn.apply(this, args) : parameterFn
        reporterFn(value)
      } catch (e) {
        // tslint:disable-next-line:no-console
        console.error(`[ERROR] Failed to apply decorator: ${e}`)
      }
      return original.apply(this, args)
    }
  }

  for (const prop of Object.keys(original)) {
    if (original.hasOwnProperty(prop) && prop.startsWith('__testdeck_')) {
      // @ts-ignore - we know that prop exists
      descriptor.value[prop] = original[prop]
    }
  }

  return descriptor
}
