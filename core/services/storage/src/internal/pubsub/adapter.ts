export interface PubSubAdapter {
  start(): Promise<void>
  // PubSub payloads cross a runtime boundary; subscribers must validate them locally.
  publish(channel: string, message: unknown): Promise<void>
  subscribe(channel: string, cb: (message: unknown) => void): Promise<void>
  unsubscribe(channel: string, cb: (message: unknown) => void): Promise<void>
  close(): Promise<void>
  on(event: 'error', listener: (error: Error) => void): this
}
