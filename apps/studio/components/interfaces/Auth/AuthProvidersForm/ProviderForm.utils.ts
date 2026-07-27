export const sanitizeProviderFormPayload = (payload: any) => {
  if (typeof payload.SMS_TEMPLATE === 'string') {
    payload.SMS_TEMPLATE = payload.SMS_TEMPLATE.replace(/\\n/g, '\n')
  }
  return payload
}
