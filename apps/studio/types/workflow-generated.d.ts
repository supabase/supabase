declare module '../../../../../.well-known/workflow/v1/flow/route.js' {
  export function POST(request: Request): Promise<Response>
}

declare module 'workflow-generated/flow' {
  export function POST(request: Request): Promise<Response>
}

declare module '../../../../../.well-known/workflow/v1/step/route.js' {
  export function POST(request: Request): Promise<Response>
}

declare module 'workflow-generated/step' {
  export function POST(request: Request): Promise<Response>
}

declare module '../../../../../.well-known/workflow/v1/webhook/[token]/route.js' {
  export function POST(request: Request): Promise<Response>
}

declare module 'workflow-generated/webhook' {
  export function POST(request: Request): Promise<Response>
}
