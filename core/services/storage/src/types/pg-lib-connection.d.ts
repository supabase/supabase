declare module 'pg/lib/connection' {
  class PgConnection {
    on(event: 'connect' | 'end' | 'error', listener: (...args: unknown[]) => void): void
    end(): void
    unref(): void
    cancel(processID: number, secretKey: number): void
    connect(port: number, host: string): void
    connect(path: string): void
  }

  export default PgConnection
}
