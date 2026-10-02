import Ajv, { type AnySchema } from 'ajv'
import { FastifySchema, FastifySchemaCompiler } from 'fastify'

export function compileNoCoercionValidator(
  schema: AnySchema,
  refs: AnySchema[] = []
): FastifySchemaCompiler<FastifySchema> {
  const ajvNoCoercion = new Ajv({
    allErrors: true,
    coerceTypes: false,
    removeAdditional: false,
    strictNumbers: true,
    useDefaults: true,
  })

  for (const ref of refs) {
    ajvNoCoercion.addSchema(ref)
  }

  const validateBody = ajvNoCoercion.compile(schema)

  return () => (data: unknown) => {
    if (validateBody(data)) return { value: data }
    return { error: validateBody.errors ?? [] }
  }
}
